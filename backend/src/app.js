const _path0 = require('path');
const _fs0 = require('fs');
require('dotenv').config({
  path: (() => {
    const root = _path0.resolve(__dirname, '../../.env');
    const local = _path0.resolve(__dirname, '../.env');
    return _fs0.existsSync(root) ? root : local;
  })(),
});
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
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const tunnelRoutes = require('./routes/tunnel');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

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
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
  })(req, res, next);
});

// CORS
app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with strict limits
app.use(express.json({ limit: '10kb' }));
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

// Global rate limiting
app.use('/api/', globalRateLimiter);

// Uploads - served as static with cache headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// Admin & public static files
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1h',
  etag: true,
  redirect: false, // prevent /admin → /admin/ redirect loop with Next.js proxy
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/tunnel', tunnelRoutes);
app.use('/api/users', userRoutes);

// SPA routing for admin
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));

// Public blog page
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, '../public/blog/index.html')));
app.get('/blog/*', (req, res) => res.sendFile(path.join(__dirname, '../public/blog/index.html')));

// Root redirect
app.get('/', (req, res) => res.redirect('/admin'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error('Server error', { err: { message: err.message, stack: err.stack }, url: req.originalUrl, method: req.method });
  }
  res.status(status).json({ error: status < 500 ? err.message : 'Internal server error' });
});

// Start
async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');
    await sequelize.sync({ force: false });
    // Add columns that may not exist in older DB instances
    await sequelize.query("ALTER TABLE blogs ADD COLUMN content_format TEXT NOT NULL DEFAULT 'html'").catch(() => {});
    await sequelize.query("ALTER TABLE blogs ADD COLUMN content_markdown TEXT").catch(() => {});
    logger.info('Database synced');

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    logger.error('Failed to start', {
      name: err.name,
      message: err.message || '(no message)',
      code: err.original?.code || err.code,
    });
    process.exit(1);
  }
}

start();

module.exports = app;
