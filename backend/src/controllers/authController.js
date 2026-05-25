const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { User, RefreshToken, SuspiciousActivity, AuthLog } = require('../models');
const logger = require('../utils/logger');

const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_DAYS = 7;

function generateTokens(user) {
  const payload = { sub: user.id, role: user.role, username: user.username };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_EXPIRES,
    issuer: process.env.JWT_ISSUER || 'pokyhlabs',
    audience: process.env.JWT_AUDIENCE || 'pokyhlabs-api',
  });
  const refreshToken = crypto.randomBytes(64).toString('hex');
  return { accessToken, refreshToken };
}

const loginValidators = [
  body('username').trim().notEmpty().isLength({ max: 50 }).escape(),
  body('password').notEmpty().isLength({ max: 128 }),
];

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress;
  const ua = req.headers['user-agent']?.slice(0, 500);

  const user = await User.findOne({ where: { username } });

  if (!user) {
    logger.warn('Unknown username', { event: 'failed_login', ip, username });
    await SuspiciousActivity.create({
      ip_address: ip, event_type: 'failed_login',
      details: `Unknown user: ${username}`, user_agent: ua, url: req.originalUrl,
    });
    AuthLog.create({ event_type: 'login_failed', ip, user_agent: ua, username, details: 'Unknown user', success: false }).catch(() => {});
    // Generic error to prevent user enumeration
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.isLocked()) {
    const waitMs = new Date(user.locked_until) - new Date();
    const waitMin = Math.ceil(waitMs / 60000);
    logger.warn('Login attempt on locked account', { event: 'locked_account', ip, userId: user.id });
    return res.status(423).json({ error: `Account locked. Try again in ${waitMin} minutes.` });
  }

  const valid = await user.validatePassword(password);
  if (!valid) {
    await user.recordFailedLogin();
    logger.warn('Wrong password', { event: 'failed_login', ip, userId: user.id, attempts: user.failed_login_attempts });
    await SuspiciousActivity.create({
      ip_address: ip, event_type: 'failed_login',
      details: `Failed attempt ${user.failed_login_attempts}`, user_agent: ua, url: req.originalUrl,
      user_id: user.id,
    });
    AuthLog.create({ event_type: 'login_failed', ip, user_agent: ua, user_id: user.id, username: user.username, details: `Attempt ${user.failed_login_attempts}`, success: false }).catch(() => {});
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await user.resetLoginAttempts(ip);
  logger.info('User logged in', { event: 'login', userId: user.id, ip });
  AuthLog.create({ event_type: 'login_success', ip, user_agent: ua, user_id: user.id, username: user.username, success: true }).catch(() => {});

  const { accessToken, refreshToken } = generateTokens(user);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400 * 1000);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: RefreshToken.hashToken(refreshToken),
    expires_at: expiresAt,
    ip_address: ip,
    user_agent: ua,
  });

  res.json({
    accessToken,
    refreshToken,
    user: user.toSafeJSON(),
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  const tokenHash = RefreshToken.hashToken(refreshToken);
  const stored = await RefreshToken.findOne({
    where: { token_hash: tokenHash },
    include: ['user'],
  });

  if (!stored || !stored.isValid()) {
    if (stored) {
      const ip = req.ip || req.socket.remoteAddress;
      logger.warn('Used invalid/expired refresh token', { event: 'invalid_token', ip, userId: stored.user_id });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Rotate: revoke old, issue new
  try {
    await stored.update({ is_revoked: true });
  } catch (e) {
    logger.error('Failed to revoke refresh token', { userId: stored.user_id, err: e.message });
    return res.status(500).json({ error: 'Token refresh failed' });
  }

  const user = stored.user;
  const { accessToken, refreshToken: newRefresh } = generateTokens(user);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400 * 1000);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: RefreshToken.hashToken(newRefresh),
    expires_at: expiresAt,
    ip_address: req.ip || req.socket.remoteAddress,
    user_agent: req.headers['user-agent']?.slice(0, 500),
  });

  res.json({ accessToken, refreshToken: newRefresh });
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const tokenHash = RefreshToken.hashToken(refreshToken);
    await RefreshToken.update({ is_revoked: true }, { where: { token_hash: tokenHash } });
  }
  // Revoke all tokens if logoutAll
  if (req.body.logoutAll && req.user?.id) {
    await RefreshToken.update({ is_revoked: true }, { where: { user_id: req.user.id } });
  }
  logger.info('User logged out', { event: 'logout', userId: req.user?.id });
  const logIp = req.ip || req.socket?.remoteAddress;
  AuthLog.create({ event_type: 'logout', ip: logIp, user_id: req.user?.id, username: req.user?.username, success: true }).catch(() => {});
  res.json({ message: 'Logged out successfully' });
}

async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'username', 'email', 'role', 'last_login', 'created_at'],
  });
  res.json(user);
}

module.exports = { login, loginValidators, refresh, logout, me };
