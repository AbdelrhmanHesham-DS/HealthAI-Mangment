const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/analytics', authorize('admin'), ctrl.getAnalytics);
router.get('/knowledge', ctrl.searchKnowledge);
router.get('/conversations',      ctrl.getConversations);
router.post('/conversations',     ctrl.createConversation);
router.get('/conversations/:id',  ctrl.getConversation);
router.post('/conversations/:id/messages', ctrl.sendMessage);
router.delete('/conversations/:id', ctrl.deleteConversation);

module.exports = router;
