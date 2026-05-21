const router = require('express').Router();
const {
  getStatus, install,
  loginStart, loginStatus,
  setupSimple, setupSimpleValidators,
  start, stop,
  installService, uninstallService,
  reconfigure,
} = require('../controllers/tunnelController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');

const guard = [authenticate, authorize('admin'), adminRateLimiter];

router.get('/status',           ...guard, getStatus);
router.post('/install',         ...guard, install);
router.post('/login',           ...guard, loginStart);
router.get('/login/status',     ...guard, loginStatus);
router.post('/setup',           ...guard, setupSimpleValidators, setupSimple);
router.post('/start',           ...guard, start);
router.post('/stop',            ...guard, stop);
router.post('/service/install', ...guard, installService);
router.post('/service/uninstall',...guard, uninstallService);
router.post('/reconfigure',     ...guard, reconfigure);

module.exports = router;
