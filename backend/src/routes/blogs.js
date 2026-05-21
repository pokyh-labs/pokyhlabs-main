const router = require('express').Router();
const {
  getPublished, getBySlug, getAll, create, update, deleteBlog, stats, blogValidators, importPdf
} = require('../controllers/blogController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { apiRateLimiter, adminRateLimiter, uploadRateLimiter } = require('../middleware/rateLimiter');
const { upload, processUpload, uploadPdf } = require('../middleware/upload');

// Public routes
router.get('/', apiRateLimiter, getPublished);
router.get('/:slug', apiRateLimiter, getBySlug);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin', 'editor'), adminRateLimiter, getAll);
router.get('/admin/stats', authenticate, authorize('admin', 'editor'), adminRateLimiter, stats);

router.post('/',
  authenticate, authorize('admin', 'editor'), adminRateLimiter, uploadRateLimiter,
  upload.single('image'), processUpload,
  blogValidators, create
);

router.put('/:id',
  authenticate, authorize('admin', 'editor'), adminRateLimiter,
  upload.single('image'), processUpload,
  blogValidators, update
);

router.delete('/:id', authenticate, authorize('admin', 'editor'), adminRateLimiter, deleteBlog);

// PDF import (must come before /:id routes, uses POST so no conflict)
router.post('/import/pdf',
  authenticate, authorize('admin', 'editor'), adminRateLimiter, uploadRateLimiter,
  uploadPdf.single('pdf'), importPdf
);

module.exports = router;
