const router = require('express').Router();
const { login, loginValidators, refresh, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/login', authRateLimiter, loginValidators, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
