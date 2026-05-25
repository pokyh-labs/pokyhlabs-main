const router = require('express').Router();
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');
const {
  getAccessLogs, getAuthLogs, getSecurityLogs,
  getGeoData, getTopCountries, getStats,
} = require('../controllers/logsController');

router.use(authenticate, authorize('admin'), adminRateLimiter);

router.get('/access',   getAccessLogs);
router.get('/auth',     getAuthLogs);
router.get('/security', getSecurityLogs);
router.get('/geo',      getGeoData);
router.get('/countries',getTopCountries);
router.get('/stats',    getStats);

module.exports = router;
