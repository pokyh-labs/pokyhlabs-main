const { body, validationResult } = require('express-validator');
const tunnelService = require('../services/tunnelService');
const { TunnelConfig } = require('../models');
const { encryptSecret, decryptSecret } = require('../config/security');
const logger = require('../utils/logger');

async function getStatus(req, res) {
  const runtime = tunnelService.getStatus();
  const config = await TunnelConfig.findOne({ order: [['created_at', 'DESC']] });
  res.json({
    ...runtime,
    installed: await tunnelService.isInstalled(),
    authenticated: tunnelService.isAuthenticated(),
    version: runtime.running ? await tunnelService.getVersion().catch(() => null) : null,
    localService: `http://localhost:${process.env.PORT || 3001}`,
    config: config ? {
      id: config.id,
      tunnel_name: config.tunnel_name,
      tunnel_id: config.tunnel_id,
      hostname: config.hostname,
      local_service: config.local_service,
      status: config.status,
      service_installed: config.service_installed,
    } : null,
  });
}

async function install(req, res) {
  try {
    await tunnelService.install();
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

const setupSimpleValidators = [
  body('tunnel_name').trim().notEmpty().matches(/^[A-Za-z0-9\-_]{1,64}$/),
  body('hostname').trim().notEmpty().isFQDN(),
  body('local_service').trim().notEmpty().isURL({ require_tld: false }),
];

async function setupSimple(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { tunnel_name, hostname, local_service } = req.body;

  try {
    logger.info('Setting up tunnel via CLI', { event: 'tunnel_setup_simple', tunnel_name, hostname });

    const tunnelId = await tunnelService.createTunnelCLI(tunnel_name);

    await tunnelService.routeDNS(tunnel_name, hostname).catch((e) => {
      logger.warn('DNS routing skipped', { error: e.message });
    });

    const tunnelToken = await tunnelService.getTunnelTokenCLI(tunnel_name);

    // Remove any existing config before saving new one
    await TunnelConfig.destroy({ where: {} });

    const config = await TunnelConfig.create({
      tunnel_name,
      tunnel_id: tunnelId,
      tunnel_token_encrypted: encryptSecret(tunnelToken),
      hostname,
      local_service,
      status: 'stopped',
    });

    res.json({ message: 'Tunnel created', tunnel_id: tunnelId, config_id: config.id });
  } catch (err) {
    logger.error('Tunnel setup failed', { event: 'tunnel_setup_error', error: err.message });
    res.status(500).json({ error: err.message });
  }
}

async function start(req, res) {
  const config = await TunnelConfig.findOne({ order: [['created_at', 'DESC']] });
  if (!config?.tunnel_token_encrypted) {
    return res.status(400).json({ error: 'No tunnel configured. Run setup first.' });
  }
  try {
    const token = decryptSecret(config.tunnel_token_encrypted);
    const result = await tunnelService.startWithToken(token);
    await config.update({ status: 'running' });
    logger.info('Tunnel started', { event: 'tunnel_start', pid: result.pid });
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
    await TunnelConfig.destroy({ where: {} });
    res.json({ message: 'Configuration cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStatus,
  install,
  loginStart,
  loginStatus,
  setupSimple,
  setupSimpleValidators,
  start,
  stop,
  installService,
  uninstallService,
  reconfigure,
};
