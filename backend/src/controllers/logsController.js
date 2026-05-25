const { Op, fn, col, literal, Sequelize } = require('sequelize');
const { AccessLog, AuthLog, SuspiciousActivity } = require('../models');

// ── Access Logs ───────────────────────────────────────────────

async function getAccessLogs(req, res) {
  const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit  = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.status)  where.status = parseInt(req.query.status, 10);
  if (req.query.method)  where.method = req.query.method.toUpperCase();
  if (req.query.ip) {
    const safeIp = req.query.ip.replace(/[%_\\]/g, '\\$&');
    where.ip = { [Op.like]: `%${safeIp}%` };
  }
  if (req.query.user_id) where.user_id = parseInt(req.query.user_id, 10);

  const { count, rows } = await AccessLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  res.json({ total: count, page, limit, logs: rows });
}

// ── Auth Logs ─────────────────────────────────────────────────

async function getAuthLogs(req, res) {
  const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit  = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.event_type) where.event_type = req.query.event_type;
  if (req.query.ip) {
    const safeIp = req.query.ip.replace(/[%_\\]/g, '\\$&');
    where.ip = { [Op.like]: `%${safeIp}%` };
  }

  const { count, rows } = await AuthLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  res.json({ total: count, page, limit, logs: rows });
}

// ── Security Logs ─────────────────────────────────────────────

async function getSecurityLogs(req, res) {
  const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit  = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.event_type) where.event_type = req.query.event_type;
  if (req.query.ip) {
    const safeIp = req.query.ip.replace(/[%_\\]/g, '\\$&');
    where.ip_address = { [Op.like]: `%${safeIp}%` };
  }

  const { count, rows } = await SuspiciousActivity.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  res.json({ total: count, page, limit, logs: rows });
}

// ── Geo data for world map ────────────────────────────────────

async function getGeoData(req, res) {
  const days = Math.min(90, parseInt(req.query.days, 10) || 30);
  const since = new Date(Date.now() - days * 86400 * 1000);

  const rows = await AccessLog.findAll({
    where: {
      lat:        { [Op.not]: null },
      lng:        { [Op.not]: null },
      created_at: { [Op.gte]: since },
    },
    attributes: [
      'country_code', 'country', 'city', 'lat', 'lng',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['country_code', 'city'],
    order: [[literal('count'), 'DESC']],
    limit: 500,
    raw: true,
  });

  res.json(rows);
}

// ── Top countries ─────────────────────────────────────────────

async function getTopCountries(req, res) {
  const days  = Math.min(90, parseInt(req.query.days, 10) || 30);
  const since = new Date(Date.now() - days * 86400 * 1000);

  const rows = await AccessLog.findAll({
    where: {
      country_code: { [Op.not]: null },
      created_at:   { [Op.gte]: since },
    },
    attributes: [
      'country_code', 'country',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['country_code'],
    order: [[literal('count'), 'DESC']],
    limit: 20,
    raw: true,
  });

  res.json(rows);
}

// ── Overview stats ────────────────────────────────────────────

async function getStats(req, res) {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const since7d  = new Date(Date.now() - 7  * 86400 * 1000);

  const [
    total24h,
    errors24h,
    authFails24h,
    secEvents24h,
    avgResponseTime,
    requestsByHour,
    topIPs,
    topEndpoints,
    statusGroups,
    uniqueIPCount,
  ] = await Promise.all([
    // Total API requests last 24h
    AccessLog.count({ where: { created_at: { [Op.gte]: since24h } } }),

    // 4xx + 5xx last 24h
    AccessLog.count({
      where: {
        created_at: { [Op.gte]: since24h },
        status:     { [Op.gte]: 400 },
      },
    }),

    // Auth failures last 24h
    AuthLog.count({
      where: {
        created_at: { [Op.gte]: since24h },
        event_type: 'login_failed',
      },
    }),

    // Security events last 24h
    SuspiciousActivity.count({ where: { created_at: { [Op.gte]: since24h } } }),

    // Avg response time last 24h
    AccessLog.findOne({
      where:      { created_at: { [Op.gte]: since24h } },
      attributes: [[fn('AVG', col('response_time')), 'avg']],
      raw: true,
    }),

    // Requests by hour (last 24h) — SQLite strftime
    AccessLog.findAll({
      where: { created_at: { [Op.gte]: since24h } },
      attributes: [
        [fn('strftime', '%H', col('created_at')), 'hour'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('strftime', '%H', col('created_at'))],
      order: [[fn('strftime', '%H', col('created_at')), 'ASC']],
      raw: true,
    }),

    // Top IPs last 24h
    AccessLog.findAll({
      where: {
        created_at: { [Op.gte]: since24h },
        ip:         { [Op.not]: null },
      },
      attributes: [
        'ip', 'country', 'country_code',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['ip'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true,
    }),

    // Top endpoints last 7d
    AccessLog.findAll({
      where: { created_at: { [Op.gte]: since7d } },
      attributes: [
        'method', 'url',
        [fn('COUNT', col('id')), 'count'],
        [fn('AVG', col('response_time')), 'avg_ms'],
      ],
      group: ['method', 'url'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true,
    }),

    // Requests by status group last 24h
    AccessLog.findAll({
      where: { created_at: { [Op.gte]: since24h } },
      attributes: [
        [literal('CAST((status / 100) * 100 AS INTEGER)'), 'status_group'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal('CAST((status / 100) * 100 AS INTEGER)')],
      raw: true,
    }),

    // Unique IPs last 24h
    AccessLog.count({
      where: {
        created_at: { [Op.gte]: since24h },
        ip:         { [Op.not]: null },
      },
      distinct: true,
      col: 'ip',
    }),
  ]);

  // Build 24-hour array (fill missing hours with 0)
  const hourMap = {};
  requestsByHour.forEach(r => { hourMap[parseInt(r.hour)] = parseInt(r.count); });
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap[h] || 0,
  }));

  res.json({
    total24h,
    errors24h,
    authFails24h,
    secEvents24h,
    uniqueIPs24h:   uniqueIPCount,
    avgResponseTime: Math.round(avgResponseTime?.avg || 0),
    hourlyData,
    topIPs,
    topEndpoints,
    statusGroups,
  });
}

module.exports = { getAccessLogs, getAuthLogs, getSecurityLogs, getGeoData, getTopCountries, getStats };
