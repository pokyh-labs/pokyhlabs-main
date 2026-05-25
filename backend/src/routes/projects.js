const router = require('express').Router();
const { getPublic, getAll, create, update, deleteProject, reorder, projectValidators } = require('../controllers/projectController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { apiRateLimiter, adminRateLimiter } = require('../middleware/rateLimiter');
// Note: image uploads go through /api/upload/presign → one-time token, not inline here

// Public
router.get('/', apiRateLimiter, getPublic);

// Admin — read
router.get('/admin/all', authenticate, authorize('admin'), adminRateLimiter, getAll);

// Admin — create
router.post('/',
  authenticate, authorize('admin'), adminRateLimiter,
  projectValidators, create
);

// Admin — reorder (before /:id to avoid conflict)
router.put('/reorder',
  authenticate, authorize('admin'), adminRateLimiter,
  reorder
);

// Admin — update
router.put('/:id',
  authenticate, authorize('admin'), adminRateLimiter,
  projectValidators, update
);

// Admin — delete
router.delete('/:id', authenticate, authorize('admin'), adminRateLimiter, deleteProject);

module.exports = router;
