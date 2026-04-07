const router = require('express').Router();
const ctrl = require('../controllers/record.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',    ctrl.getRecords);
router.post('/',   ctrl.createRecord);
router.get('/:id', ctrl.getRecordById);
router.put('/:id', ctrl.updateRecord);
router.delete('/:id', ctrl.deleteRecord);

module.exports = router;
