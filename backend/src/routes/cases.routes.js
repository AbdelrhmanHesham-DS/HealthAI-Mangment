const router = require('express').Router();
const ctrl = require('../controllers/cases.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/',     ctrl.getCases);
router.post('/',    ctrl.createCase);
router.get('/:id',  ctrl.getCaseById);
router.delete('/:id', ctrl.deleteCase);

module.exports = router;
