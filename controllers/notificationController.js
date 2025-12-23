const User = require('../models/User');
const { sendNotificationToUser, sendNotificationToUsers, sendNotificationToRole } = require('../services/notificationService');

/**
 * Save or update FCM token for the authenticated user
 * POST /api/notifications/token
 */
exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken || fcmToken.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Update user's FCM token
    await User.findByIdAndUpdate(userId, { fcmToken: fcmToken.trim() });

    res.status(200).json({
      success: true,
      message: 'FCM token saved successfully'
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove FCM token for the authenticated user
 * DELETE /api/notifications/token
 */
exports.removeFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });

    res.status(200).json({
      success: true,
      message: 'FCM token removed successfully'
    });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Send test notification to the authenticated user
 * POST /api/notifications/test
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, body, data } = req.body;

    const notificationTitle = title || 'Test Notification';
    const notificationBody = body || 'This is a test notification from Kindify';

    const result = await sendNotificationToUser(
      userId,
      notificationTitle,
      notificationBody,
      data || {}
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Send notification to specific users (Admin only)
 * POST /api/notifications/send
 */
exports.sendNotification = async (req, res) => {
  try {
    const { userIds, role, title, body, data } = req.body;

    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send notifications'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    let result;

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      result = await sendNotificationToUsers(userIds, title, body, data || {});
    } else if (role) {
      // Send to all users with specific role
      result = await sendNotificationToRole(role, title, body, data || {});
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either userIds array or role must be provided'
      });
    }

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        successCount: result.successCount,
        failureCount: result.failureCount
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



