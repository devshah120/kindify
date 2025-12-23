const admin = require('../config/firebase');
const User = require('../models/User');

/**
 * Send notification to a single device
 * @param {string} fcmToken - FCM token of the device
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the notification send
 */
async function sendNotificationToDevice(fcmToken, title, body, data = {}) {
  if (!fcmToken) {
    throw new Error('FCM token is required');
  }

  if (!admin.apps.length) {
    console.warn('Firebase not initialized. Skipping notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      ...data,
      timestamp: new Date().toISOString()
    },
    token: fcmToken,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      // Remove invalid token from user
      await User.updateOne(
        { fcmToken: fcmToken },
        { $unset: { fcmToken: 1 } }
      );
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple devices
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the batch notification send
 */
async function sendNotificationToMultipleDevices(fcmTokens, title, body, data = {}) {
  if (!fcmTokens || fcmTokens.length === 0) {
    return { success: false, error: 'FCM tokens array is required' };
  }

  if (!admin.apps.length) {
    console.warn('Firebase not initialized. Skipping notification.');
    return { success: false, error: 'Firebase not initialized' };
  }

  // Filter out null/undefined tokens
  const validTokens = fcmTokens.filter(token => token && token.trim() !== '');

  if (validTokens.length === 0) {
    return { success: false, error: 'No valid FCM tokens provided' };
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      ...data,
      timestamp: new Date().toISOString()
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    tokens: validTokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Handle invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(validTokens[idx]);
          }
        }
      });

      // Remove invalid tokens from users
      if (invalidTokens.length > 0) {
        await User.updateMany(
          { fcmToken: { $in: invalidTokens } },
          { $unset: { fcmToken: 1 } }
        );
      }
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to a user by user ID
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the notification send
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    const user = await User.findById(userId).select('fcmToken');
    if (!user || !user.fcmToken) {
      return { success: false, error: 'User not found or no FCM token registered' };
    }

    return await sendNotificationToDevice(user.fcmToken, title, body, data);
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users by user IDs
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the batch notification send
 */
async function sendNotificationToUsers(userIds, title, body, data = {}) {
  try {
    const users = await User.find({ _id: { $in: userIds } }).select('fcmToken');
    const fcmTokens = users
      .map(user => user.fcmToken)
      .filter(token => token && token.trim() !== '');

    if (fcmTokens.length === 0) {
      return { success: false, error: 'No FCM tokens found for the provided users' };
    }

    return await sendNotificationToMultipleDevices(fcmTokens, title, body, data);
  } catch (error) {
    console.error('Error sending notifications to users:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to all users with a specific role
 * @param {string} role - User role ('Trust', 'User', 'Admin')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the batch notification send
 */
async function sendNotificationToRole(role, title, body, data = {}) {
  try {
    const users = await User.find({ role, fcmToken: { $exists: true, $ne: null } })
      .select('fcmToken');
    
    const fcmTokens = users
      .map(user => user.fcmToken)
      .filter(token => token && token.trim() !== '');

    if (fcmTokens.length === 0) {
      return { success: false, error: `No FCM tokens found for users with role: ${role}` };
    }

    return await sendNotificationToMultipleDevices(fcmTokens, title, body, data);
  } catch (error) {
    console.error('Error sending notifications to role:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole
};



