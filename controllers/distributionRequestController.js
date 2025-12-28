const DistributionRequest = require('../models/DistributionRequest');
const { deleteFromCloudinary } = require('../config/cloudinary');
const User = require('../models/User');
const { sendNotificationToUser } = require('../services/notificationService');

// Create a new distribution request
exports.createDistributionRequest = async (req, res) => {
  try {
    const {
      userId,
      date,
      categoryId,
      trustName,
      phone,
      email,
      streetName,
      state,
      city,
      pinCode,
      requiredItem
    } = req.body;

    // Check if proof image was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Proof image is required' 
      });
    }

    // Prepare request data - date is optional
    const requestData = {
      userId,
      categoryId,
      trustName,
      phone,
      email,
      address: {
        streetName,
        state,
        city,
        pinCode
      },
      proofImage: req.file.path, // Cloudinary URL
      requiredItem
    };

    // Only include date if it's provided and valid (date is optional)
    if (date && String(date).trim() !== '') {
      requestData.date = date;
    }

    const distributionRequest = new DistributionRequest(requestData);

    await distributionRequest.save();
    
    // Populate category and user details
    await distributionRequest.populate('categoryId', 'name');
    await distributionRequest.populate('userId', 'name email profilePhoto');

    // Get user info for notification
    const user = await User.findById(userId).select('name email');
    const userName = user?.name || 'User';

    // Send notification to user confirming their request was submitted
    try {
      await sendNotificationToUser(
        userId,
        'Request Submitted Successfully! ✅',
        `Your distribution request for ${requiredItem} has been submitted successfully. We'll review it and get back to you soon!`,
        {
          type: 'distribution_request_submitted',
          requestId: distributionRequest._id.toString(),
          requiredItem: requiredItem,
          status: 'pending'
        }
      );
      console.log(`✅ Notification sent to user confirming distribution request: ${distributionRequest._id}`);
    } catch (userNotificationError) {
      console.error('❌ Error sending user confirmation notification:', userNotificationError);
    }

    // Find trust admin to notify (if trustName is provided, find the trust)
    try {
      if (trustName) {
        const trust = await User.findOne({ trustName: trustName, role: 'Trust' }).select('_id trustName');
        if (trust) {
          await sendNotificationToUser(
            trust._id,
            'New Distribution Request',
            `${userName} has submitted a distribution request for ${requiredItem}`,
            {
              type: 'distribution_request_created',
              requestId: distributionRequest._id.toString(),
              userId: userId,
              requiredItem: requiredItem
            }
          );
          console.log(`✅ Notification sent to trust about distribution request: ${distributionRequest._id}`);
        }
      }
    } catch (notificationError) {
      console.error('❌ Error sending distribution request notification:', notificationError);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Distribution request created successfully',
      data: distributionRequest 
    });
  } catch (err) {
    // Delete uploaded file from Cloudinary if request fails
    if (req.file && req.file.path) {
      await deleteFromCloudinary(req.file.path);
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all distribution requests
exports.getAllDistributionRequests = async (req, res) => {
  try {
    const { status, userId, trustName } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (trustName) filter.trustName = trustName;

    const requests = await DistributionRequest.find(filter)
      .populate('categoryId', 'name')
      .populate('userId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: requests.length,
      data: requests 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get distribution request by ID
exports.getDistributionRequestById = async (req, res) => {
  try {
    const request = await DistributionRequest.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('userId', 'name email phone profilePhoto');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Distribution request not found' 
      });
    }

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update distribution request status
exports.updateDistributionRequest = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (remarks) updateData.remarks = remarks;

    const request = await DistributionRequest.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('categoryId', 'name')
     .populate('userId', 'name email phone profilePhoto');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Distribution request not found' 
      });
    }

    // Send notification to user about status update
    if (status && request.userId && request.userId._id) {
      try {
        const statusMessage = status === 'approved' 
          ? 'Your distribution request has been approved! ✅'
          : status === 'rejected'
          ? 'Your distribution request has been rejected.'
          : `Your distribution request status has been updated to: ${status}`;

        await sendNotificationToUser(
          request.userId._id,
          'Distribution Request Update',
          statusMessage,
          {
            type: 'distribution_request_updated',
            requestId: request._id.toString(),
            status: status,
            requiredItem: request.requiredItem
          }
        );
        console.log(`✅ Notification sent to user about distribution request update: ${request._id}`);
      } catch (notificationError) {
        console.error('❌ Error sending distribution request update notification:', notificationError);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Distribution request updated successfully',
      data: request 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete distribution request
exports.deleteDistributionRequest = async (req, res) => {
  try {
    const request = await DistributionRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Distribution request not found' 
      });
    }

    // Delete the proof image from Cloudinary
    if (request.proofImage) {
      await deleteFromCloudinary(request.proofImage);
    }

    await DistributionRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      message: 'Distribution request deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get requests by user
exports.getUserDistributionRequests = async (req, res) => {
  try {
    const requests = await DistributionRequest.find({ userId: req.params.userId })
      .populate('categoryId', 'name')
      .populate('userId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: requests.length,
      data: requests 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

