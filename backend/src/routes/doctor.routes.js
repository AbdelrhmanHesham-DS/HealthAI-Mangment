const router = require('express').Router();
const ctrl = require('../controllers/doctor.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/cities',         ctrl.getCities);
router.get('/symptom-check',  ctrl.symptomCheck);
router.get('/',               ctrl.getDoctors);
router.get('/:id',            ctrl.getDoctorById);
router.post('/',   protect, authorize('admin'), ctrl.createDoctor);
router.put('/:id', protect, authorize('admin'), ctrl.updateDoctor);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteDoctor);

module.exports = router;
