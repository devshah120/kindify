const DistributionAlert = require('../models/DistributionAlert');
const User = require('../models/User');
const { sendNotificationToUsers } = require('../services/notificationService');
const { sendMail } = require('../config/mailer');

// Helper: Send distribution alert email
async function sendDistributionAlertEmail(userEmail, userName, alertData, creatorName) {
  const subject = 'Distribution Alert - Kindify';
  const alertDate = new Date(alertData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const alertTime = alertData.time || 'TBA';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Distribution Alert</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 0; margin: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding: 20px; background: linear-gradient(135deg, #ff6f61 0%, #fcb248 100%);">
                <img src="https://res.cloudinary.com/dcxwy01a6/image/upload/v1765426499/kindify-logo_tzapkk.png" alt="Kindify Logo" width="120" style="display: block;">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 20px; text-align: center;">
                <h1 style="color: #333; margin: 0 0 10px 0;">Distribution Alert 📦</h1>
                <p style="color: #666; font-size: 16px; margin: 0;">Hello <strong>${userName}</strong>,</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 40px;">
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                  <strong>${creatorName}</strong> has created a distribution alert for you.
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">📍 Location:</p>
                  <p style="color: #555; font-size: 15px; margin: 0 0 15px 0;">${alertData.location}</p>
                  
                  <p style="color: #333; font-size: 16px; font-weight: bold; margin: 15px 0 10px 0;">📅 Date:</p>
                  <p style="color: #555; font-size: 15px; margin: 0 0 15px 0;">${alertDate}</p>
                  
                  ${alertData.time ? `
                  <p style="color: #333; font-size: 16px; font-weight: bold; margin: 15px 0 10px 0;">⏰ Time:</p>
                  <p style="color: #555; font-size: 15px; margin: 0 0 15px 0;">${alertData.time}</p>
                  ` : ''}
                  
                  <p style="color: #333; font-size: 16px; font-weight: bold; margin: 15px 0 10px 0;">📝 Description:</p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">${alertData.description}</p>
                </div>
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">
                  Please mark your calendar and be present at the distribution location on the specified date.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background: #f1f1f1; text-align: center; font-size: 12px; color: #888;">
                © 2025 Kindify. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  await sendMail({ to: userEmail, subject, html });
}

// Create a new distribution alert
exports.createDistributionAlert = async (req, res) => {
  try {
    const { categoryId, location, description, date, time, selectedUserIds } = req.body;

    // Validate required fields
    if (!categoryId || !location || !description || !date || !selectedUserIds || !Array.isArray(selectedUserIds) || selectedUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'categoryId, location, description, date, and selectedUserIds (non-empty array) are required'
      });
    }

    // Validate date
    const alertDate = new Date(date);
    if (isNaN(alertDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Get creator info
    const creator = await User.findById(req.user.id).select('trustName adminName name role');
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    const creatorName = creator.role === 'Trust' ? creator.trustName : creator.name;

    // Create the distribution alert
    const distributionAlert = await DistributionAlert.create({
      categoryId,
      location,
      description,
      date: alertDate,
      time: time || null,
      selectedUserIds,
      createdBy: req.user.id,
      status: 'active'
    });

    // Populate category for response
    await distributionAlert.populate('categoryId', 'name icon');

    // Get selected users' information
    const selectedUsers = await User.find({ _id: { $in: selectedUserIds } })
      .select('name email fcmToken');

    // Send notifications to selected users
    const notificationResults = {
      successCount: 0,
      failureCount: 0,
      emailResults: []
    };

    // Send push notifications
    try {
      const fcmTokens = selectedUsers
        .map(user => user.fcmToken)
        .filter(token => token && token.trim() !== '');

      if (fcmTokens.length > 0) {
        const notificationResult = await sendNotificationToUsers(
          selectedUserIds,
          'Distribution Alert 📦',
          `${creatorName}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
          {
            type: 'distribution_alert',
            alertId: distributionAlert._id.toString(),
            location: location,
            date: date,
            creatorName: creatorName
          }
        );

        notificationResults.successCount = notificationResult.successCount || 0;
        notificationResults.failureCount = notificationResult.failureCount || 0;
        console.log(`✅ Notifications sent: ${notificationResults.successCount} success, ${notificationResults.failureCount} failed`);
      }
    } catch (notificationError) {
      console.error('❌ Error sending push notifications:', notificationError);
    }

    // Send emails to selected users
    for (const user of selectedUsers) {
      try {
        if (user.email) {
          await sendDistributionAlertEmail(
            user.email,
            user.name || 'User',
            {
              location,
              description,
              date: alertDate,
              time: time || null
            },
            creatorName
          );
          notificationResults.emailResults.push({
            userId: user._id.toString(),
            email: user.email,
            success: true
          });
          console.log(`✅ Email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending email to ${user.email}:`, emailError);
        notificationResults.emailResults.push({
          userId: user._id.toString(),
          email: user.email,
          success: false,
          error: emailError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Distribution alert created and notifications sent',
      alert: distributionAlert,
      notificationResults: {
        pushNotifications: {
          successCount: notificationResults.successCount,
          failureCount: notificationResults.failureCount
        },
        emails: {
          total: notificationResults.emailResults.length,
          success: notificationResults.emailResults.filter(r => r.success).length,
          failed: notificationResults.emailResults.filter(r => !r.success).length,
          results: notificationResults.emailResults
        }
      }
    });
  } catch (error) {
    console.error('Error creating distribution alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create distribution alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all distribution alerts
exports.getAllDistributionAlerts = async (req, res) => {
  try {
    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (status && ['active', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // If user is not admin, only show alerts they created or were selected for
    if (req.user.role !== 'Admin') {
      query.$or = [
        { createdBy: req.user.id },
        { selectedUserIds: req.user.id }
      ];
    }

    const alerts = await DistributionAlert.find(query)
      .populate('categoryId', 'name icon')
      .populate('createdBy', 'trustName adminName name email role')
      .populate('selectedUserIds', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalAlerts = await DistributionAlert.countDocuments(query);

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      totalAlerts,
      alerts
    });
  } catch (error) {
    console.error('Error fetching distribution alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get distribution alert by ID
exports.getDistributionAlertById = async (req, res) => {
  try {
    const alert = await DistributionAlert.findById(req.params.id)
      .populate('categoryId', 'name icon')
      .populate('createdBy', 'trustName adminName name email role')
      .populate('selectedUserIds', 'name email profilePhoto');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Distribution alert not found'
      });
    }

    res.status(200).json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error fetching distribution alert:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update distribution alert status
exports.updateDistributionAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: active, completed, cancelled'
      });
    }

    const alert = await DistributionAlert.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name icon')
      .populate('createdBy', 'trustName adminName name email role')
      .populate('selectedUserIds', 'name email profilePhoto');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Distribution alert not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Distribution alert status updated successfully',
      alert
    });
  } catch (error) {
    console.error('Error updating distribution alert:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete distribution alert
exports.deleteDistributionAlert = async (req, res) => {
  try {
    const alert = await DistributionAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Distribution alert not found'
      });
    }

    // Only creator or admin can delete
    if (req.user.role !== 'Admin' && alert.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this alert'
      });
    }

    await DistributionAlert.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Distribution alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distribution alert:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

