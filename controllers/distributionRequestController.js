const DistributionRequest = require('../models/DistributionRequest');
const { deleteFromCloudinary } = require('../config/cloudinary');

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
    await distributionRequest.populate('userId', 'name email');

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
    const { status, userId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const requests = await DistributionRequest.find(filter)
      .populate('categoryId', 'name')
      .populate('userId', 'name email phone')
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
      .populate('userId', 'name email phone');

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
     .populate('userId', 'name email phone');

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Distribution request not found' 
      });
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

