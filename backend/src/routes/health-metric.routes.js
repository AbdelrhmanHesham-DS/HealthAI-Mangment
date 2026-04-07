const router = require('express').Router();
const ctrl = require('../controllers/health-metric.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/summary', ctrl.getSummary);
router.get('/',        ctrl.getMetrics);
router.post('/',       ctrl.addMetric);
router.delete('/:id',  ctrl.deleteMetric);

module.exports = router;
