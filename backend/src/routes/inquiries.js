const crypto = require('crypto');
const router = require('express').Router();
const { createInquiry, createInboundInquiry, getInquiries, updateInquiryStatus, deleteInquiry } = require('../controllers/inquiryController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { apiRateLimiter, inquiryRateLimiter, adminRateLimiter } = require('../middleware/rateLimiter');

// Shared-secret gate for the inbound-email endpoint. Only the Cloudflare Email
// Worker knows INBOUND_EMAIL_SECRET, so no public client can inject inquiries.
function inboundAuth(req, res, next) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (!secret) return res.status(503).json({ error: 'Inbound email is not configured.' });
  const provided = req.get('X-Inbound-Secret') || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// Public — contact form submission. Strict per-IP limit as anti-spam.
router.post('/', inquiryRateLimiter, createInquiry);

// Inbound email (Cloudflare Email Worker) — same pipeline as the form.
// Kept on the looser apiRateLimiter: every email arrives via the single Worker
// egress IP, so a strict per-IP limit would throttle unrelated senders together.
// Per-sender spam control lives in the Worker (confirmation dedup window).
router.post('/inbound', apiRateLimiter, inboundAuth, createInboundInquiry);

// Admin only
router.get('/', authenticate, authorize('admin'), adminRateLimiter, getInquiries);
router.patch('/:id/status', authenticate, authorize('admin'), adminRateLimiter, updateInquiryStatus);
router.delete('/:id', authenticate, authorize('admin'), adminRateLimiter, deleteInquiry);

module.exports = router;
