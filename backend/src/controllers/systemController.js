const fs   = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { ErrorLog } = require('../models');
const logger = require('../utils/logger');

// MySQL's LIKE is case-insensitive; Postgres LIKE is case-sensitive. Use ILIKE
// on Postgres so substring filters behave identically across dialects.
const likeOp = () => (ErrorLog.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like);

let lastBackupTime = 0;
const BACKUP_COOLDOWN_MS = 10 * 60 * 1000;

function dirSizeSync(dir) {
  let total = 0;
  try {
    for (const item of fs.readdirSync(dir)) {
      try {
        const s = fs.statSync(path.join(dir, item));
        total += s.isDirectory() ? dirSizeSync(path.join(dir, item)) : s.size;
      } catch {}
    }
  } catch {}
  return total;
}

async function getHealth(req, res) {
  const sqlitePath = process.env.SQLITE_PATH || null;
  const uploadPath = process.env.UPLOAD_PATH || null;

  let dbSize = 0;
  if (sqlitePath) {
    try { dbSize = fs.statSync(sqlitePath).size; } catch {}
  }

  let uploadsSize = 0;
  if (uploadPath) uploadsSize = dirSizeSync(uploadPath);

  const mem = process.memoryUsage();

  res.json({
    uptime:      Math.floor(process.uptime()),
    nodeVersion: process.version,
    env:         process.env.NODE_ENV || 'development',
    database:    { path: sqlitePath, sizeBytes: dbSize },
    uploads:     { path: uploadPath, sizeBytes: uploadsSize },
    memory: {
      heapUsed:  mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss:       mem.rss,
    },
    timestamp: new Date().toISOString(),
  });
}

async function getErrorLogs(req, res) {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.endpoint)    where.endpoint    = { [likeOp()]: `%${req.query.endpoint}%` };
  if (req.query.status_code) where.status_code = parseInt(req.query.status_code);

  const { count, rows } = await ErrorLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  res.json({ total: count, page, limit, logs: rows });
}

async function triggerBackup(req, res) {
  const now = Date.now();
  if (now - lastBackupTime < BACKUP_COOLDOWN_MS) {
    const remaining = Math.ceil((BACKUP_COOLDOWN_MS - (now - lastBackupTime)) / 1000);
    return res.status(429).json({ error: `Backup-Limit: Bitte warte noch ${remaining}s.` });
  }

  const sqlitePath = process.env.SQLITE_PATH;
  if (!sqlitePath) {
    return res.status(500).json({ error: 'SQLITE_PATH nicht konfiguriert.' });
  }

  const backupsDir = path.join(path.dirname(sqlitePath), 'backups');

  try {
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

    const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-${ts}.sqlite`;
    const destPath = path.join(backupsDir, filename);

    fs.copyFileSync(sqlitePath, destPath);
    lastBackupTime = Date.now();

    logger.info('Database backup created', { filename });

    res.json({
      success: true,
      filename,
      sizeBytes: fs.statSync(destPath).size,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Backup failed', { message: err.message });
    res.status(500).json({ error: 'Backup fehlgeschlagen: ' + err.message });
  }
}

module.exports = { getHealth, getErrorLogs, triggerBackup };
