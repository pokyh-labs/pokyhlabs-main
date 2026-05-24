const router = require('express').Router();
const { authenticate }     = require('../middleware/authenticate');
const { authorize }        = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');
const { getConfig, updateConfig, purgeCache, getAnalytics, getTunnelStatus } = require('../controllers/cloudflareController');

router.use(authenticate, authorize('admin'), adminRateLimiter);

router.get('/config',   getConfig);
router.put('/config',   updateConfig);
router.post('/purge',   purgeCache);
router.get('/analytics', getAnalytics);
router.get('/tunnel',   getTunnelStatus);

module.exports = router;
