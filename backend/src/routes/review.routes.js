const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', ctrl.getReviews);
router.post('/', protect, ctrl.createReview);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteReview);

module.exports = router;
