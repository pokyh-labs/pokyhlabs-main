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

// Consume the one-time token and upload the file (token IS the auth — no JWT needed)
router.put('/:token',
  uploadRateLimiter,
  validateToken,
  multerUpload.single('file'),
  consumeUpload
);

module.exports = router;
