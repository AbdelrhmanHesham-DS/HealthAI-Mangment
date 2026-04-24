const router = require('express').Router();
const ctrl   = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/generate', protect, ctrl.generateReport);
router.get('/health-summary', protect, ctrl.healthSummary);

// AI-Enhanced Consultation Report
router.post('/consultation', protect, ctrl.generateConsultationReport);

module.exports = router;
