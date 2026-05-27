const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const tunnelService = require('../services/tunnelService');
const { TunnelConfig } = require('../models');
const { encryptSecret, decryptSecret } = require('../config/security');
const logger = require('../utils/logger');

// ── Hostname sanitizer ────────────────────────────────────────────────────────
// Strips protocol, path, port, trailing slashes — so the user can safely enter
// "https://pokyh.studio/" or "pokyh.studio" and both produce "pokyh.studio".
function sanitizeHostname(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let h = raw.trim().toLowerCase();
  // Strip protocol
  h = h.replace(/^https?:\/\//i, '');
  // Strip path, query, hash
  h = h.split('/')[0].split('?')[0].split('#')[0];
  // Strip port
  h = h.split(':')[0];
  // Strip trailing dot
  h = h.replace(/\.$/, '');
  return h.trim();
}

// ── SSE helper ────────────────────────────────────────────────────────────────
// EventSource cannot send custom headers, so auth token comes as ?token= query param.
function sseAuth(req) {
  const token = req.query.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer:   process.env.JWT_ISSUER   || 'pokyhlabs',
      audience: process.env.JWT_AUDIENCE || 'pokyhlabs-api',
    });
  } catch { return null; }
}

function sseSetup(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (type, data) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };
  const end = () => { if (!res.writableEnded) res.end(); };
  return { send, end };
}

// ── Standard REST handlers ────────────────────────────────────────────────────

async function getStatus(req, res) {
  const runtime = tunnelService.getStatus();
  const config  = await TunnelConfig.findOne({ order: [['created_at', 'DESC']] });
  res.json({
    ...runtime,
    installed:     await tunnelService.isInstalled(),
    authenticated: tunnelService.isAuthenticated(),
    version:       await tunnelService.getVersion().catch(() => null),
    localService:  `http://localhost:${process.env.PORT || 3000}`,
    fatalError:    runtime.fatalError || null,
    config: config ? {
      id:                config.id,
      tunnel_name:       config.tunnel_name,
      tunnel_id:         config.tunnel_id,
      hostname:          config.hostname,
      local_service:     config.local_service,
      status:            config.status,
      service_installed: config.service_installed,
    } : null,
  });
}

async function install(req, res) {
  try {
    await tunnelService.installStream(() => {});
    const version = await tunnelService.getVersion();
    res.json({ message: 'cloudflared installed', version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function loginStart(req, res) {
  try {
    const result = await tunnelService.startLogin();
    res.json({ url: result.url });
  } catch (err) {
    logger.error('Tunnel login failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}

async function loginStatus(req, res) {
  res.json({ authenticated: tunnelService.isAuthenticated() });
}

// ── SSE: install stream ───────────────────────────────────────────────────────
async function installSSE(req, res) {
  if (!sseAuth(req)) return res.status(401).end();
  const { send, end } = sseSetup(res);
  req.on('close', () => {});
  try {
    await tunnelService.installStream((line) => send('log', line));
    send('done', null);
  } catch (err) {
    logger.error('Tunnel install (SSE) failed', { error: err.message });
    send('error', err.message);
  } finally { end(); }
}

// ── SSE: login stream ─────────────────────────────────────────────────────────
async function loginSSE(req, res) {
  if (!sseAuth(req)) return res.status(401).end();
  const { send, end } = sseSetup(res);
  req.on('close', () => {});
  try {
    await tunnelService.loginStream((ev) => send(ev.type, ev.data));
    send('done', null);
  } catch (err) {
    logger.error('Tunnel login (SSE) failed', { error: err.message });
    send('error', err.message);
  } finally { end(); }
}

// ── SSE: setup stream (1:1 with reference repo tunnel-stream) ─────────────────
// Query params: tunnel_name, hostname, local_service
async function setupSSE(req, res) {
  if (!sseAuth(req)) return res.status(401).end();
  const { send, end } = sseSetup(res);
  req.on('close', () => {});

  const tunnelName   = typeof req.query.tunnel_name   === 'string' ? req.query.tunnel_name.trim() : '';
  const hostname     = sanitizeHostname(req.query.hostname);
  const localService = typeof req.query.local_service === 'string' ? req.query.local_service.trim() : `http://localhost:${process.env.PORT || 3000}`;

  try {
    if (!tunnelName || !hostname) {
      send('error', 'tunnel_name and hostname are required');
      return end();
    }

    if (!tunnelService.isAuthenticated()) {
      send('error', 'Not authenticated with Cloudflare. Complete the login step first.');
      return end();
    }

    // Clear any previous fatal error so a fresh setup always starts clean
    tunnelService.clearFatalError();

    send('log', `Setting up tunnel '${tunnelName}' → ${hostname}`);
    send('log', `Local service: ${localService}`);

    // Find existing or create new tunnel
    send('log', 'Checking for existing tunnel...');
    const tunnelId = await tunnelService.findOrCreateTunnel(tunnelName);
    send('log', `Tunnel ID: ${tunnelId}`);

    // Write config.yml with ingress rules
    send('log', 'Writing ~/.cloudflared/config.yml...');
    tunnelService.writeConfig(tunnelId, tunnelName, hostname, localService);
    send('log', 'Config written ✓');

    // Route DNS — fail the whole setup if this fails (tunnel won't work without it)
    send('log', `Routing DNS: ${hostname} → tunnel...`);
    try {
      await tunnelService.routeDNS(tunnelName, hostname);
      send('log', 'DNS route configured ✓');
    } catch (e) {
      const msg = e.message.split('\n')[0];
      // "already exists" is OK — the record is just being reused
      if (/already exist|duplicate/i.test(msg)) {
        send('log', `DNS: record already exists — OK`);
      } else {
        send('error', `DNS routing failed: ${msg}\nMake sure your domain is on Cloudflare and the API key has DNS permissions.`);
        return end();
      }
    }

    // Persist to DB for UI display
    await TunnelConfig.destroy({ where: {} });
    const config = await TunnelConfig.create({
      tunnel_name:   tunnelName,
      tunnel_id:     tunnelId,
      hostname,
      local_service: localService,
      status: 'stopped',
    });

    // Stop any existing tunnel first
    await tunnelService.stop();

    // Start tunnel by name (reference-repo approach: cloudflared tunnel run <name>)
    send('log', 'Starting tunnel process...');
    const { pid } = await tunnelService.startByName(tunnelName);
    await config.update({ status: 'running' });
    logger.info('Tunnel started via setup stream', { event: 'tunnel_start', pid, tunnelName });

    send('done', `Tunnel is running!\nYour site is now live at: https://${hostname}`);
  } catch (err) {
    logger.error('Tunnel setup (SSE) failed', { error: err.message });
    send('error', err.message);
  } finally { end(); }
}

// ── Tunnel setup REST (POST /tunnel/setup) ────────────────────────────────────
// Body: { tunnel_name, hostname, local_service }
// 1:1 logic with setupSSE but as a standard REST response.

const setupSimpleValidators = [
  body('tunnel_name').trim().notEmpty().matches(/^[A-Za-z0-9\-_]{1,64}$/),
  body('hostname').trim().notEmpty(),
  body('local_service').trim().notEmpty().isURL({ require_tld: false }),
];

async function setupSimple(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { tunnel_name, local_service } = req.body;
  const hostname = sanitizeHostname(req.body.hostname);

  if (!hostname) return res.status(400).json({ error: 'Invalid hostname' });

  // Validate local_service is a safe localhost URL
  try {
    const parsed = new URL(local_service);
    const safe   = ['localhost', '127.0.0.1', '::1'];
    const port   = parseInt(parsed.port, 10);
    if (!safe.includes(parsed.hostname) || port < 1024 || port > 65535) {
      return res.status(400).json({ error: 'local_service must be a localhost URL with port 1024–65535' });
    }
  } catch {
    return res.status(400).json({ error: 'local_service is not a valid URL' });
  }

  if (!tunnelService.isAuthenticated()) {
    return res.status(400).json({ error: 'Not authenticated with Cloudflare. Complete the login step first.' });
  }

  try {
    logger.info('Setting up tunnel', { event: 'tunnel_setup', tunnel_name, hostname });

    // Clear any previous fatal error so a fresh setup always starts clean
    tunnelService.clearFatalError();

    // Find or create tunnel
    const tunnelId = await tunnelService.findOrCreateTunnel(tunnel_name);

    // Write config.yml with ingress rules
    tunnelService.writeConfig(tunnelId, tunnel_name, hostname, local_service);

    // Route DNS
    try {
      await tunnelService.routeDNS(tunnel_name, hostname);
    } catch (e) {
      if (!/already exist|duplicate/i.test(e.message)) {
        return res.status(500).json({ error: `DNS routing failed: ${e.message.split('\n')[0]}` });
      }
      logger.warn('DNS record already exists — reusing', { hostname });
    }

    // Persist to DB
    await TunnelConfig.destroy({ where: {} });
    const config = await TunnelConfig.create({
      tunnel_name,
      tunnel_id:    tunnelId,
      hostname,
      local_service,
      status: 'stopped',
    });

    // Stop existing tunnel, then start by name
    await tunnelService.stop();
    const { pid } = await tunnelService.startByName(tunnel_name);
    await config.update({ status: 'running' });
    logger.info('Tunnel started', { event: 'tunnel_start', pid });

    res.json({ message: 'Tunnel created and started', tunnel_id: tunnelId, config_id: config.id });
  } catch (err) {
    logger.error('Tunnel setup failed', { event: 'tunnel_setup_error', error: err.message });
    res.status(500).json({ error: err.message });
  }
}

// ── Start / Stop ──────────────────────────────────────────────────────────────

async function start(req, res) {
  // Prefer config.yml-based start (reference approach)
  if (tunnelService.isTunnelConfigured()) {
    const name = tunnelService.getTunnelNameFromConfig();
    if (name) {
      try {
        const result = await tunnelService.startByName(name);
        await TunnelConfig.update({ status: 'running' }, { where: {}, order: [['created_at', 'DESC']], limit: 1 });
        logger.info('Tunnel started', { event: 'tunnel_start', pid: result.pid });
        return res.json({ message: 'Tunnel started', pid: result.pid });
      } catch (err) {
        await TunnelConfig.update({ status: 'error' }, { where: {}, order: [['created_at', 'DESC']], limit: 1 });
        return res.status(500).json({ error: err.message });
      }
    }
  }

  // Fallback: token-based (legacy)
  const config = await TunnelConfig.findOne({ order: [['created_at', 'DESC']] });
  if (!config?.tunnel_token_encrypted) {
    return res.status(400).json({ error: 'No tunnel configured. Run setup first.' });
  }
  try {
    const token  = decryptSecret(config.tunnel_token_encrypted);
    const result = await tunnelService.startWithToken(token);
    await config.update({ status: 'running' });
    logger.info('Tunnel started (token)', { event: 'tunnel_start', pid: result.pid });
    res.json({ message: 'Tunnel started', pid: result.pid });
  } catch (err) {
    await config.update({ status: 'error' });
    res.status(500).json({ error: err.message });
  }
}

async function stop(req, res) {
  try {
    await tunnelService.stop();
    await TunnelConfig.update({ status: 'stopped' }, {
      where: { status: 'running' },
      order: [['created_at', 'DESC']],
      limit: 1,
    });
    res.json({ message: 'Tunnel stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── Service install / uninstall ───────────────────────────────────────────────

async function installService(req, res) {
  const config = await TunnelConfig.findOne({ order: [['created_at', 'DESC']] });
  if (!config?.tunnel_token_encrypted) {
    return res.status(400).json({ error: 'No tunnel configured.' });
  }
  try {
    const token = decryptSecret(config.tunnel_token_encrypted);
    await tunnelService.installService(token);
    await config.update({ service_installed: true });
    logger.info('cloudflared installed as system service', { event: 'tunnel_service_install' });
    res.json({ message: 'cloudflared installed as system service' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function uninstallService(req, res) {
  try {
    await tunnelService.uninstallService();
    await TunnelConfig.update({ service_installed: false }, { where: { service_installed: true } });
    res.json({ message: 'cloudflared service uninstalled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reconfigure(req, res) {
  try {
    await tunnelService.stop();
    tunnelService.clearFatalError();
    await TunnelConfig.destroy({ where: {} });
    res.json({ message: 'Configuration cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStatus,
  install,
  installSSE,
  loginStart,
  loginStatus,
  loginSSE,
  setupSSE,
  setupSimple,
  setupSimpleValidators,
  start,
  stop,
  installService,
  uninstallService,
  reconfigure,
};
