const router = require('express').Router();
const {
  listUsers, createUser, updateUser, deleteUser,
  createUserValidators, updateUserValidators,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');

// All routes: admin only
router.use(authenticate, authorize('admin'), adminRateLimiter);

router.get('/', listUsers);
router.post('/', createUserValidators, createUser);
router.put('/:id', updateUserValidators, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
