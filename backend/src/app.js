const _path0 = require('path');
const _fs0 = require('fs');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: (() => {
      const root = _path0.resolve(__dirname, '../../.env');
      const local = _path0.resolve(__dirname, '../.env');
      return _fs0.existsSync(root) ? root : local;
    })(),
  });
}
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const morgan = require('morgan');
const crypto = require('crypto');

const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { detectSuspiciousInput, detectSuspiciousUA } = require('./middleware/sanitize');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const authRoutes       = require('./routes/auth');
const blogRoutes       = require('./routes/blogs');
const userRoutes       = require('./routes/users');
const logsRoutes       = require('./routes/logs');
const systemRoutes     = require('./routes/system');
const seoRoutes        = require('./routes/seo');
const inquiryRoutes    = require('./routes/inquiries');
const projectRoutes    = require('./routes/projects');
const uploadRoutes     = require('./routes/upload');
const honeypotRoutes   = require('./routes/honeypot');
const requestLogger    = require('./middleware/requestLogger');
const errorLogger      = require('./middleware/errorLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// API responses must never be served from HTTP cache — prevents stale 304s in browsers
app.use('/api/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Generate CSP nonce per request
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Security headers
app.use((req, res, next) => {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    hsts: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  })(req, res, next);
});

// ── Static files (served BEFORE CORS) ────────────────────────────────────────
// Vite production builds emit <script type="module" crossorigin> which causes
// browsers to include an Origin header on asset requests. Serving assets here
// short-circuits before the CORS middleware runs — no false CORS rejections.
const BACKEND_ROOT = path.resolve(__dirname, '..');
const _rawUploadPath = process.env.UPLOAD_PATH || 'uploads';
const UPLOAD_SERVE_DIR = path.isAbsolute(_rawUploadPath)
  ? _rawUploadPath
  : path.resolve(BACKEND_ROOT, _rawUploadPath);

app.use('/uploads', express.static(UPLOAD_SERVE_DIR, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1h',
  etag: true,
  redirect: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
// Dynamic origin check: allows ALLOWED_ORIGINS env var, localhost, AND whatever
// host/IP the client actually used to reach this server — so LAN access
// (e.g. 192.168.x.x) and custom domains work without hardcoding a single address.
app.use((req, res, next) => {
  const port = process.env.PORT || 3000;
  const fallback = `http://localhost:${port}`;
  const allowed = (process.env.ALLOWED_ORIGINS || fallback).split(',').map(s => s.trim());

  // Include the server's own origin as seen by this request (any IP or hostname)
  const host = req.headers.host;
  if (host) {
    [`http://${host}`, `https://${host}`].forEach(o => { if (!allowed.includes(o)) allowed.push(o); });
  }

  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })(req, res, next);
});

// Body parsing — blogs/projects carry rich HTML content so they need a larger limit;
// other endpoints use a strict 10 kb limit to reduce DoS surface
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(hpp());
app.use(compression());

// HTTP request logging
app.use(morgan(':remote-addr - :method :url :status :response-time ms - :res[content-length]', {
  stream: { write: (msg) => logger.info(msg.trim(), { type: 'http' }) },
}));

// Suspicious activity detection
app.use(detectSuspiciousUA);
app.use(detectSuspiciousInput);

// Request logging (access log to DB — must be before routes)
app.use(requestLogger);

// Global rate limiting
app.use('/api/', globalRateLimiter);

// API routes
app.use('/api/auth',        authRoutes);
app.use('/api/blogs',       blogRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/logs',        logsRoutes);
app.use('/api/system',      systemRoutes);
app.use('/api/seo',         seoRoutes);
app.use('/api/inquiries',   inquiryRoutes);
app.use('/api/projects',   projectRoutes);
app.use('/api/upload',     uploadRoutes);

// SPA routing for admin
// Asset paths (/admin/assets/*) are NOT caught here — if express.static didn't
// serve them, they fall through to the 404 handler. This prevents the
// global error handler from returning application/json for missing JS/CSS files.
const ADMIN_HTML = path.join(__dirname, '../public/admin/index.html');
const BLOG_HTML  = path.join(__dirname, '../public/blog/index.html');

app.get('/admin', (req, res, next) => {
  res.sendFile(ADMIN_HTML, (err) => { if (err) next(err); });
});
app.get('/admin/*', (req, res, next) => {
  if (req.path.startsWith('/admin/assets/')) return next();
  res.sendFile(ADMIN_HTML, (err) => { if (err) next(err); });
});

// Public blog page
app.get('/blog', (req, res, next) => {
  res.sendFile(BLOG_HTML, (err) => { if (err) next(err); });
});
app.get('/blog/*', (req, res, next) => {
  if (req.path.startsWith('/blog/assets/')) return next();
  res.sendFile(BLOG_HTML, (err) => { if (err) next(err); });
});

// Root redirect
app.get('/', (req, res) => res.redirect('/admin'));

// Honeypot — must be before 404 so real routes always take priority
app.use('/', honeypotRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Log 5xx errors to DB before responding
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error('Server error', { err: { message: err.message, stack: err.stack }, url: req.originalUrl, method: req.method });
  }
  res.status(status).json({ error: status < 500 ? err.message : 'Internal server error' });
});

// Database initialisation (called by server.js or standalone start below)
async function initDatabase() {
  await sequelize.authenticate();
  logger.info('Database connected');
  
  // Add columns that may not exist in older DB instances before sync creates indexes based on them
  await sequelize.query("ALTER TABLE blogs ADD COLUMN content_format TEXT NOT NULL DEFAULT 'html'").catch(() => {});
  await sequelize.query("ALTER TABLE blogs ADD COLUMN content_markdown TEXT").catch(() => {});
  await sequelize.query("ALTER TABLE inquiries ADD COLUMN createdAt DATETIME").catch(() => {});
  await sequelize.query("ALTER TABLE inquiries ADD COLUMN updatedAt DATETIME").catch(() => {});
  await sequelize.query("ALTER TABLE inquiries ADD COLUMN deadline DATE").catch(() => {});
  await sequelize.query("ALTER TABLE projects ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0").catch(() => {});
  await sequelize.query("ALTER TABLE projects ADD COLUMN image_url TEXT").catch(() => {});
  await sequelize.query("ALTER TABLE projects ADD COLUMN image_alt TEXT").catch(() => {});
  await sequelize.query("ALTER TABLE projects ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]'").catch(() => {});
  
  // Multi-language CMS columns
  await sequelize.query("ALTER TABLE blogs ADD COLUMN translations TEXT NOT NULL DEFAULT '{}'").catch(() => {});
  await sequelize.query("ALTER TABLE blogs ADD COLUMN slug_de VARCHAR(300)").catch(() => {});
  await sequelize.query("ALTER TABLE blogs ADD COLUMN slug_en VARCHAR(300)").catch(() => {});
  await sequelize.query("ALTER TABLE blogs ADD COLUMN slug_it VARCHAR(300)").catch(() => {});
  await sequelize.query("ALTER TABLE projects ADD COLUMN translations TEXT NOT NULL DEFAULT '{}'").catch(() => {});
  
  await sequelize.sync({ force: false });
  logger.info('Database synced');

  // Auto-create admin from .env if no users exist yet
  const { User } = require('./models');
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_USERNAME && ADMIN_EMAIL && ADMIN_PASSWORD) {
    const count = await User.count();
    if (count === 0) {
      await User.create({ username: ADMIN_USERNAME, email: ADMIN_EMAIL, password_hash: ADMIN_PASSWORD, role: 'admin' });
      logger.info(`Default admin "${ADMIN_USERNAME}" created from .env`);
    }
  }
}

// Only auto-start when this file is the entry point (e.g. npm run dev:backend)
if (require.main === module) {
  initDatabase()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Server running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
      });
    })
    .catch(err => {
      logger.error('Failed to start', {
        name: err.name,
        message: err.message || '(no message)',
        code: err.original?.code || err.code,
      });
      process.exit(1);
    });
}

module.exports = { app, initDatabase };
