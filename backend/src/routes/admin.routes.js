const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

// Stats & Dashboard
router.get('/stats',                  ctrl.getStats);
router.get('/dashboard-summary',      ctrl.getDashboardSummary);

// Users Management
router.get('/users',                  ctrl.getUsers);
router.get('/users/:id',              ctrl.getUserById);
router.put('/users/:id',              ctrl.updateUser);
router.put('/users/:id/approve',      ctrl.approveDoctor);
router.put('/users/:id/reject',       ctrl.rejectDoctor);
router.put('/users/:id/role',         ctrl.updateUserRole);
router.delete('/users/:id',           ctrl.deleteUser);

// Doctors
router.get('/pending-doctors',        ctrl.getPendingDoctors);

// Appointments
router.get('/appointments',           ctrl.getAllAppointments);
router.post('/appointments',          ctrl.createAppointment);
router.put('/appointments/:id',       ctrl.updateAppointment);
router.put('/appointments/:id/status', ctrl.updateAppointmentStatus);
router.delete('/appointments/:id',    ctrl.deleteAppointment);

// Reviews
router.get('/reviews',                ctrl.getAllReviews);
router.delete('/reviews/:id',         ctrl.deleteReview);

// Analytics
router.get('/analytics/revenue',      ctrl.getRevenueAnalytics);
router.get('/analytics/appointments', ctrl.getAppointmentAnalytics);
router.get('/analytics/doctors',      ctrl.getDoctorAnalytics);
router.get('/analytics/patients',     ctrl.getPatientAnalytics);

// Bulk Operations
router.post('/bulk/approve-doctors',  ctrl.bulkApproveDoctors);
router.post('/bulk/reject-doctors',   ctrl.bulkRejectDoctors);
router.post('/bulk/delete-users',     ctrl.bulkDeleteUsers);

// Notifications
router.post('/notifications/send',    ctrl.sendNotification);
router.post('/notifications/broadcast', ctrl.broadcastNotification);

// Activity Logs
router.get('/activity-logs',          ctrl.getActivityLogs);
router.post('/activity-logs',         ctrl.createActivityLog);

// Export
router.get('/export/users',           ctrl.exportUsers);
router.get('/export/appointments',    ctrl.exportAppointments);

module.exports = router;
