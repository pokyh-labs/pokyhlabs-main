const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { SuspiciousActivity } = require('../models');

function createLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessful || false,
    handler: async (req, res) => {
      const ip = req.ip || req.socket.remoteAddress;
      logger.warn('Rate limit exceeded', {
        event: 'rate_limit_hit',
        ip,
        url: req.originalUrl,
        ua: req.headers['user-agent'],
      });

      try {
        await SuspiciousActivity.create({
          ip_address: ip,
          event_type: 'rate_limit_hit',
          details: `Endpoint: ${req.originalUrl}`,
          user_agent: req.headers['user-agent']?.slice(0, 500),
          url: req.originalUrl,
        });
      } catch {}

      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) + ' minutes',
      });
    },
    keyGenerator: (req) => req.ip || req.socket.remoteAddress,
  });
}

const globalRateLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 200 });

// Very strict for auth endpoints
const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessful: true,
});

// Moderate for general API
const apiRateLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 100 });

// Strict for admin API
const adminRateLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 60 });

// Upload limiter
const uploadRateLimiter = createLimiter({ windowMs: 60 * 60 * 1000, max: 20 });

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  adminRateLimiter,
  uploadRateLimiter,
};
