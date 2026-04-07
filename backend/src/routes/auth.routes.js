const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadAvatar, uploadDocument } = require('../middleware/upload.middleware');

router.post('/register',         ctrl.register);
router.post('/login',            ctrl.login);
router.get('/me',    protect,    ctrl.getMe);
router.put('/me',    protect,    ctrl.updateMe);
router.put('/change-password', protect, ctrl.changePassword);
router.post('/upload-avatar', protect, uploadAvatar, ctrl.uploadAvatar);
router.post('/upload-id-document', protect, uploadDocument, ctrl.uploadIdDocument);

module.exports = router;
