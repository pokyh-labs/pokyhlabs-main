const router = require('express').Router();
const { authenticate }  = require('../middleware/authenticate');
const { authorize }     = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');
const { getSeoConfig, updateSeoConfig, getSitemapPreview, getRobotsPreview } = require('../controllers/seoController');

router.use(authenticate, authorize('admin'), adminRateLimiter);

router.get('/config',          getSeoConfig);
router.put('/config',          updateSeoConfig);
router.get('/sitemap-preview', getSitemapPreview);
router.get('/robots-preview',  getRobotsPreview);

module.exports = router;
