const router = require('express').Router();
const {
  getStatus,
  install, installSSE,
  loginStart, loginStatus, loginSSE,
  setupSSE,
  setupSimple, setupSimpleValidators,
  start, stop,
  installService, uninstallService,
  reconfigure,
} = require('../controllers/tunnelController');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');

const guard = [authenticate, authorize('admin'), adminRateLimiter];

// Standard REST
router.get('/status',               ...guard, getStatus);
router.post('/install',             ...guard, install);
router.post('/login',               ...guard, loginStart);
router.get('/login/status',         ...guard, loginStatus);
router.post('/setup',               ...guard, setupSimpleValidators, setupSimple);
router.post('/start',               ...guard, start);
router.post('/stop',                ...guard, stop);
router.post('/service/install',     ...guard, installService);
router.post('/service/uninstall',   ...guard, uninstallService);
router.post('/reconfigure',         ...guard, reconfigure);

// SSE streams — auth via ?token= (EventSource can't send headers)
router.get('/install/stream', installSSE);
router.get('/login/stream',   loginSSE);
router.get('/setup/stream',   setupSSE);

module.exports = router;
