const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { sanitizeText } = require('../middleware/sanitize');
const logger = require('../utils/logger');

const createUserValidators = [
  body('username')
    .trim().notEmpty().withMessage('Username required')
    .isLength({ min: 3, max: 50 }).withMessage('3–50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Only letters, numbers, _ and -'),
  body('email')
    .trim().notEmpty().isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .notEmpty().isLength({ min: 8, max: 128 }).withMessage('Min. 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Needs uppercase, lowercase, and digit'),
  body('role')
    .optional().isIn(['admin', 'editor']).withMessage('Invalid role'),
];

const updateUserValidators = [
  body('role').optional().isIn(['admin', 'editor']).withMessage('Invalid role'),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('password')
    .optional().isLength({ min: 8, max: 128 })
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Needs uppercase, lowercase, and digit'),
  body('unlock').optional().isBoolean(),
];

async function listUsers(req, res) {
  const users = await User.findAll({
    attributes: ['id', 'username', 'email', 'role', 'last_login', 'created_at', 'locked_until', 'failed_login_attempts'],
    order: [['created_at', 'ASC']],
  });
  res.json(users);
}

async function createUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, role } = req.body;

  const [byUsername, byEmail] = await Promise.all([
    User.findOne({ where: { username } }),
    User.findOne({ where: { email } }),
  ]);
  if (byUsername) return res.status(409).json({ error: 'Username already taken' });
  if (byEmail) return res.status(409).json({ error: 'Email already registered' });

  const user = await User.create({
    username: sanitizeText(username),
    email,
    password_hash: password,
    role: role || 'editor',
  });

  logger.info('User created by admin', { event: 'user_create', newUserId: user.id, createdBy: req.user.id });
  res.status(201).json(user.toSafeJSON());
}

async function updateUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const targetId = parseInt(req.params.id);
  const user = await User.findByPk(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (targetId === req.user.id && req.body.role && req.body.role !== user.role) {
    return res.status(403).json({ error: 'Cannot change your own role' });
  }

  const updates = {};
  if (req.body.email !== undefined) updates.email = req.body.email;
  if (req.body.role !== undefined) updates.role = req.body.role;
  if (req.body.password) updates.password_hash = req.body.password;
  if (req.body.unlock === true || req.body.unlock === 'true') {
    updates.locked_until = null;
    updates.failed_login_attempts = 0;
  }

  await user.update(updates);
  logger.info('User updated by admin', { event: 'user_update', targetUserId: targetId, updatedBy: req.user.id });
  res.json(user.toSafeJSON());
}

async function deleteUser(req, res) {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.id) {
    return res.status(403).json({ error: 'Cannot delete your own account' });
  }

  const user = await User.findByPk(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await user.destroy();
  logger.info('User deleted by admin', { event: 'user_delete', targetUserId: targetId, deletedBy: req.user.id });
  res.json({ message: 'User deleted' });
}

module.exports = { listUsers, createUser, updateUser, deleteUser, createUserValidators, updateUserValidators };
