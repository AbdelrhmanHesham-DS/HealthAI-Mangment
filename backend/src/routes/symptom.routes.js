const router = require('express').Router();
const ctrl = require('../controllers/symptom.controller');

router.post('/chat',       ctrl.chat);
router.post('/reset',      ctrl.reset);
router.post('/flow',       ctrl.flow);
router.post('/flow/reset', ctrl.flowReset);
router.post('/analyze',    ctrl.analyze);

module.exports = router;
