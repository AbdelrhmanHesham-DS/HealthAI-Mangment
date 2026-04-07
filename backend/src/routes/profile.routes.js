const router = require('express').Router();
const ctrl = require('../controllers/profile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.get('/', protect, ctrl.getProfile);
router.put('/', protect, ctrl.updateProfile);
router.get('/:id', protect, authorize('admin'), ctrl.getUserProfile);

module.exports = router;
