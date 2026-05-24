const { updateEnv } = require('../utils/envWriter');
const logger = require('../utils/logger');

const CF_BASE = 'https://api.cloudflare.com/client/v4';

const CF_KEYS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ZONE_ID',
  'CLOUDFLARE_TUNNEL_TOKEN',
];

function mask(val) {
  if (!val) return '';
  return val.length <= 8 ? '****' : '****' + val.slice(-4);
}

function cfHeaders() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    const err = new Error('CLOUDFLARE_API_TOKEN nicht konfiguriert');
    err.status = 503;
    throw err;
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function cfFetch(url, options = {}) {
  const res  = await fetch(url, { ...options, headers: { ...cfHeaders(), ...options.headers } });
  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message || 'Cloudflare API Fehler';
    const err = new Error(msg);
    err.status = res.status < 500 ? res.status : 502;
    throw err;
  }
  return data.result;
}

async function getConfig(req, res) {
  res.json({
    accountId:   process.env.CLOUDFLARE_ACCOUNT_ID   || '',
    apiToken:    mask(process.env.CLOUDFLARE_API_TOKEN),
    zoneId:      process.env.CLOUDFLARE_ZONE_ID       || '',
    tunnelToken: mask(process.env.CLOUDFLARE_TUNNEL_TOKEN),
    configured:  !!(
      process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_API_TOKEN  &&
      process.env.CLOUDFLARE_ZONE_ID
    ),
  });
}

async function updateConfig(req, res) {
  const toWrite = {};
  for (const key of CF_KEYS) {
    if (req.body[key] !== undefined) {
      const val = String(req.body[key]).trim();
      // Skip empty values and masked placeholders
      if (val && !val.startsWith('****')) {
        toWrite[key] = val;
      }
    }
  }

  if (Object.keys(toWrite).length === 0) {
    return res.status(400).json({ error: 'Keine aktualisierbaren Felder übergeben.' });
  }

  await updateEnv(toWrite);
  logger.info('Cloudflare config updated', { keys: Object.keys(toWrite) });
  res.json({ success: true, updated: Object.keys(toWrite) });
}

async function purgeCache(req, res) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) return res.status(503).json({ error: 'CLOUDFLARE_ZONE_ID nicht konfiguriert.' });

  await cfFetch(`${CF_BASE}/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    body:   JSON.stringify({ purge_everything: true }),
  });

  logger.info('Cloudflare cache purged');
  res.json({ success: true, message: 'Cache erfolgreich geleert.' });
}

async function getAnalytics(req, res) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) return res.status(503).json({ error: 'CLOUDFLARE_ZONE_ID nicht konfiguriert.' });

  const result = await cfFetch(`${CF_BASE}/zones/${zoneId}/analytics/dashboard?since=-1440&until=0`);
  const totals = result?.totals || {};

  res.json({
    requests:   totals.requests?.all   || 0,
    bandwidth:  totals.bandwidth?.all  || 0,
    threats:    totals.threats?.all    || 0,
    pageviews:  totals.pageviews?.all  || 0,
    uniques:    totals.uniques?.all    || 0,
    period:     '24h',
  });
}

async function getTunnelStatus(req, res) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) return res.status(503).json({ error: 'CLOUDFLARE_ACCOUNT_ID nicht konfiguriert.' });

  const result  = await cfFetch(`${CF_BASE}/accounts/${accountId}/cfd_tunnel?is_deleted=false&per_page=20`);
  const tunnels = Array.isArray(result) ? result : [];

  res.json({
    tunnels: tunnels.map(t => ({
      id:          t.id,
      name:        t.name,
      status:      t.status,
      created_at:  t.created_at,
      connections: t.connections_count || 0,
    })),
  });
}

module.exports = { getConfig, updateConfig, purgeCache, getAnalytics, getTunnelStatus };
