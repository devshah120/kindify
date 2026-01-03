const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

// FCM Token Management
router.post('/notifications/token', auth, notificationController.saveFcmToken);
router.delete('/notifications/token', auth, notificationController.removeFcmToken);
router.delete('/notifications/token/:userId', auth, notificationController.removeFcmTokenByUserId);

// Test Notification
router.post('/notifications/test', auth, notificationController.sendTestNotification);

// Send Notification (Admin only)
router.post('/notifications/send', auth, notificationController.sendNotification);

module.exports = router;



