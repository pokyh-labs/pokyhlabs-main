const router = require('express').Router();
const { createInquiry, getInquiries, updateInquiryStatus, deleteInquiry } = require('../controllers/inquiryController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { apiRateLimiter, adminRateLimiter } = require('../middleware/rateLimiter');

// Public — contact form submission
router.post('/', apiRateLimiter, createInquiry);

// Admin only
router.get('/', authenticate, authorize('admin'), adminRateLimiter, getInquiries);
router.patch('/:id/status', authenticate, authorize('admin'), adminRateLimiter, updateInquiryStatus);
router.delete('/:id', authenticate, authorize('admin'), adminRateLimiter, deleteInquiry);

module.exports = router;
