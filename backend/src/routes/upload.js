const router = require('express').Router();
const { presign, validateToken, multerUpload, consumeUpload } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { adminRateLimiter, uploadRateLimiter } = require('../middleware/rateLimiter');

// Request a one-time upload token (requires login)
router.post('/presign',
  authenticate, authorize('admin', 'editor'), adminRateLimiter, uploadRateLimiter,
  presign
);

// Consume the one-time token and upload the file (token IS the auth — no JWT needed).
// validateToken runs first: a valid token marks the request as authenticated, so
// uploadRateLimiter skips it. Anonymous requests with a bad token are rejected by
// validateToken before they ever reach the limiter.
router.put('/:token',
  validateToken,
  uploadRateLimiter,
  multerUpload.single('file'),
  consumeUpload
);

module.exports = router;
