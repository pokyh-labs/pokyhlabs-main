const router = require('express').Router();
const { authenticate }  = require('../middleware/authenticate');
const { authorize }     = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');
const { getHealth, getErrorLogs, triggerBackup } = require('../controllers/systemController');

router.use(authenticate, authorize('admin'), adminRateLimiter);

router.get('/health',  getHealth);
router.get('/errors',  getErrorLogs);
router.post('/backup', triggerBackup);

module.exports = router;
