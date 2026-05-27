const router = require('express').Router();
const {
  getPublished, getBySlug, incrementView, getAll, create, update, deleteBlog, stats, patchViews, blogValidators, importPdf, importHtml
} = require('../controllers/blogController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { apiRateLimiter, adminRateLimiter, uploadRateLimiter } = require('../middleware/rateLimiter');
// Note: image uploads go through /api/upload/presign → one-time token, not inline here
const { uploadPdf, uploadHtml } = require('../middleware/upload');

// Public routes
router.get('/', apiRateLimiter, getPublished);
router.post('/:slug/view', apiRateLimiter, incrementView);
router.get('/:slug', apiRateLimiter, getBySlug);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin', 'editor'), adminRateLimiter, getAll);
router.get('/admin/stats', authenticate, authorize('admin', 'editor'), adminRateLimiter, stats);

router.post('/',
  authenticate, authorize('admin', 'editor'), adminRateLimiter,
  blogValidators, create
);

router.put('/:id',
  authenticate, authorize('admin', 'editor'), adminRateLimiter,
  blogValidators, update
);

router.delete('/:id', authenticate, authorize('admin', 'editor'), adminRateLimiter, deleteBlog);

// Patch only the views counter
router.patch('/:id/views', authenticate, authorize('admin', 'editor'), adminRateLimiter, patchViews);

// PDF import
router.post('/import/pdf',
  authenticate, authorize('admin', 'editor'), adminRateLimiter, uploadRateLimiter,
  uploadPdf.single('pdf'), importPdf
);

// HTML import
router.post('/import/html',
  authenticate, authorize('admin', 'editor'), adminRateLimiter, uploadRateLimiter,
  uploadHtml.single('html'), importHtml
);

module.exports = router;
