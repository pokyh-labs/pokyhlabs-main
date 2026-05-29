const { Op, fn, col, literal, Sequelize } = require('sequelize');
const { AccessLog, AuthLog, SuspiciousActivity } = require('../models');
const { cache, KEYS, LOG_STATS_TTL } = require('../config/cache');

const dialect = () => AccessLog.sequelize.getDialect();

// MySQL's LIKE is case-insensitive by default; Postgres LIKE is case-sensitive.
// Use ILIKE on Postgres so substring filters behave identically across dialects.
const likeOp = () => (dialect() === 'postgres' ? Op.iLike : Op.like);

// Hour-of-day extraction differs per dialect:
//   mysql    → HOUR(col)
//   postgres → date_part('hour', col)   (equivalent to EXTRACT(HOUR FROM col))
//   sqlite   → strftime('%H', col)
function hourFn() {
  const d = dialect();
  if (d === 'mysql')    return fn('HOUR', col('created_at'));
  if (d === 'postgres') return fn('date_part', 'hour', col('created_at'));
  return fn('strftime', '%H', col('created_at'));
}

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
    where.ip = { [likeOp()]: `%${safeIp}%` };
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
    where.ip = { [likeOp()]: `%${safeIp}%` };
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
    where.ip_address = { [likeOp()]: `%${safeIp}%` };
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
  const cacheKey = KEYS.LOG_GEO(days);
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const since = new Date(Date.now() - days * 86400 * 1000);

  const rows = await AccessLog.findAll({
    where: {
      lat:        { [Op.not]: null },
      lng:        { [Op.not]: null },
      created_at: { [Op.gte]: since },
    },
    attributes: [
      // Include all selected columns in GROUP BY to satisfy ONLY_FULL_GROUP_BY
      'country_code', 'country', 'city', 'lat', 'lng',
      [fn('COUNT', col('AccessLog.id')), 'count'],
    ],
    group: ['country_code', 'country', 'city', 'lat', 'lng'],
    order: [[literal('count'), 'DESC']],
    limit: 500,
    raw: true,
  });

  cache.set(cacheKey, rows, LOG_STATS_TTL);
  res.json(rows);
}

// ── Top countries ─────────────────────────────────────────────

async function getTopCountries(req, res) {
  const days  = Math.min(90, parseInt(req.query.days, 10) || 30);
  const cacheKey = KEYS.LOG_COUNTRIES(days);
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const since = new Date(Date.now() - days * 86400 * 1000);

  const rows = await AccessLog.findAll({
    where: {
      country_code: { [Op.not]: null },
      created_at:   { [Op.gte]: since },
    },
    attributes: [
      'country_code', 'country',
      [fn('COUNT', col('AccessLog.id')), 'count'],
    ],
    // Include country in GROUP BY — functionally dependent on country_code but
    // MySQL ONLY_FULL_GROUP_BY requires explicit listing.
    group: ['country_code', 'country'],
    order: [[literal('count'), 'DESC']],
    limit: 20,
    raw: true,
  });

  cache.set(cacheKey, rows, LOG_STATS_TTL);
  res.json(rows);
}

// ── Overview stats ────────────────────────────────────────────

async function getStats(req, res) {
  const cached = cache.get(KEYS.LOG_STATS);
  if (cached) return res.json(cached);

  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const since7d  = new Date(Date.now() - 7  * 86400 * 1000);
  // Hour-of-day expression, dialect-aware (see hourFn above).
  const hourExpr   = hourFn();
  const hourGroup  = [hourFn()];
  const hourOrder  = [[hourFn(), 'ASC']];

  // Status-group expression: FLOOR(status/100)*100 works on MySQL, Postgres and SQLite
  const statusGroupExpr = literal('FLOOR(status / 100) * 100');

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
    AccessLog.count({ where: { created_at: { [Op.gte]: since24h } } }),

    AccessLog.count({
      where: {
        created_at: { [Op.gte]: since24h },
        status:     { [Op.gte]: 400 },
      },
    }),

    AuthLog.count({
      where: {
        created_at: { [Op.gte]: since24h },
        event_type: 'login_failed',
      },
    }),

    SuspiciousActivity.count({ where: { created_at: { [Op.gte]: since24h } } }),

    AccessLog.findOne({
      where:      { created_at: { [Op.gte]: since24h } },
      attributes: [[fn('AVG', col('response_time')), 'avg']],
      raw: true,
    }),

    AccessLog.findAll({
      where: { created_at: { [Op.gte]: since24h } },
      attributes: [
        [hourExpr, 'hour'],
        [fn('COUNT', col('AccessLog.id')), 'count'],
      ],
      group: hourGroup,
      order: hourOrder,
      raw: true,
    }),

    // Top IPs — include country + country_code in GROUP BY for MySQL compat
    AccessLog.findAll({
      where: {
        created_at: { [Op.gte]: since24h },
        ip:         { [Op.not]: null },
      },
      attributes: [
        'ip', 'country', 'country_code',
        [fn('COUNT', col('AccessLog.id')), 'count'],
      ],
      group: ['ip', 'country', 'country_code'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true,
    }),

    AccessLog.findAll({
      where: { created_at: { [Op.gte]: since7d } },
      attributes: [
        'method', 'url',
        [fn('COUNT', col('AccessLog.id')), 'count'],
        [fn('AVG', col('response_time')), 'avg_ms'],
      ],
      group: ['method', 'url'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true,
    }),

    AccessLog.findAll({
      where: { created_at: { [Op.gte]: since24h } },
      attributes: [
        [statusGroupExpr, 'status_group'],
        [fn('COUNT', col('AccessLog.id')), 'count'],
      ],
      group: [statusGroupExpr],
      raw: true,
    }),

    AccessLog.count({
      where: {
        created_at: { [Op.gte]: since24h },
        ip:         { [Op.not]: null },
      },
      distinct: true,
      col: 'ip',
    }),
  ]);

  const hourMap = {};
  requestsByHour.forEach(r => { hourMap[parseInt(r.hour)] = parseInt(r.count); });
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap[h] || 0,
  }));

  const result = {
    total24h,
    errors24h,
    authFails24h,
    secEvents24h,
    uniqueIPs24h:    uniqueIPCount,
    avgResponseTime: Math.round(avgResponseTime?.avg || 0),
    hourlyData,
    topIPs,
    topEndpoints,
    statusGroups,
  };
  cache.set(KEYS.LOG_STATS, result, LOG_STATS_TTL);
  res.json(result);
}

module.exports = { getAccessLogs, getAuthLogs, getSecurityLogs, getGeoData, getTopCountries, getStats };
