const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/stats',                  ctrl.getStats);
router.get('/users',                  ctrl.getUsers);
router.get('/pending-doctors',        ctrl.getPendingDoctors);
router.get('/appointments',           ctrl.getAllAppointments);
router.put('/users/:id/approve',      ctrl.approveDoctor);
router.put('/users/:id/reject',       ctrl.rejectDoctor);
router.delete('/users/:id',           ctrl.deleteUser);
router.put('/users/:id/role',         ctrl.updateUserRole);

module.exports = router;
