const router = require('express').Router();
const ctrl = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',    ctrl.getAppointments);
router.post('/',   ctrl.createAppointment);
router.post('/admin', authorize('admin'), ctrl.createAdminAppointment);
router.get('/:id', ctrl.getAppointmentById);
router.put('/:id/status',   authorize('admin', 'doctor'), ctrl.updateStatus);
router.patch('/:id',        ctrl.updateAppointment); // For general updates
router.put('/:id/cancel',   ctrl.cancelAppointment);
router.put('/:id/reviewed', ctrl.markReviewed);

module.exports = router;
