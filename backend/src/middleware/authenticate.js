const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { SuspiciousActivity } = require('../models');

async function logSuspicious(req, eventType, details) {
  const ip = req.ip || req.socket.remoteAddress;
  logger.warn('Suspicious activity', { event: eventType, ip, url: req.originalUrl, details });
  try {
    await SuspiciousActivity.create({
      ip_address: ip,
      event_type: 'invalid_token',
      details: `${eventType}: ${details}`,
      user_agent: req.headers['user-agent']?.slice(0, 500),
      url: req.originalUrl,
    });
  } catch {}
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'pokyhlabs',
      audience: process.env.JWT_AUDIENCE || 'pokyhlabs-api',
    });

    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
    };
    next();
  } catch (err) {
    await logSuspicious(req, 'invalid_token', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Like authenticate(), but never rejects: if a valid Bearer token is present it
 * attaches req.user, otherwise it simply continues. Used early in the pipeline
 * so rate limiters can tell logged-in users apart from anonymous/external ones.
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'pokyhlabs',
      audience: process.env.JWT_AUDIENCE || 'pokyhlabs-api',
    });
    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
    };
  } catch {
    // Invalid/expired token → treat as anonymous (the protected route's own
    // authenticate() will return the proper 401 later).
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
