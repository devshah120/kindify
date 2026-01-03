const Campaign = require('../models/Campaign');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendNotificationToRole } = require('../services/notificationService');

// POST /api/campaigns - Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const {
      campaignTitle,
      startDate,
      endDate,
      category,
      minAmount,
      maxAmount,
      goal,
      description
    } = req.body;

    // Validate required fields
    if (!campaignTitle || !startDate || !endDate || !category || 
        minAmount === undefined || maxAmount === undefined || 
        goal === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields. Required: campaignTitle, startDate, endDate, category, minAmount, maxAmount, goal' 
      });
    }

    // Validate campaignTitle length
    if (campaignTitle.length > 50) {
      return res.status(400).json({ message: 'campaignTitle must be 50 characters or less' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'endDate must be after startDate' });
    }

    // Validate amounts
    if (minAmount < 0 || maxAmount < 0 || goal < 0) {
      return res.status(400).json({ message: 'Amounts must be non-negative' });
    }

    if (maxAmount < minAmount) {
      return res.status(400).json({ message: 'maxAmount must be greater than or equal to minAmount' });
    }

    const campaign = await Campaign.create({
      campaignTitle,
      startDate: start,
      endDate: end,
      category,
      minAmount,
      maxAmount,
      goal,
      raisedAmount: 0, // Initialize raised amount to 0
      description,
      status: 'active', // Default status is active
      createdBy: req.user.id // Track creator
    });

    // Populate creator and category info
    await campaign.populate('createdBy', 'email role trustName adminName name');
    await campaign.populate('category', 'name icon');

    // Get creator info for notification
    const creator = campaign.createdBy;
    const creatorName = creator.role === 'Trust' ? creator.trustName : creator.name;

    // Send notification to all users about the new campaign
    try {
      await sendNotificationToRole(
        'User', // Only send to users with role "User", not "Trust"
        'New Campaign Launched! 🎯',
        `${creatorName} launched a new campaign: ${campaignTitle}`,
        {
          type: 'new_campaign',
          campaignId: campaign._id.toString(),
          campaignTitle: campaignTitle,
          creatorName: creatorName
        }
      );
      console.log(`✅ Notification sent to all users about new campaign: ${campaign._id}`);
    } catch (notificationError) {
      console.error('❌ Error sending campaign notification:', notificationError);
    }

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (err) {
    console.error('Create Campaign Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create campaign' });
  }
};

// GET /api/campaigns - Get all campaigns
exports.getCampaigns = async (req, res) => {
  try {
    let { page = 1, limit = 10, category, userId } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (category) {
      // Check if category is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        return res.status(400).json({ error: 'Invalid category ID format' });
      }
    }
    
    // Filter by userId (createdBy) if provided
    if (userId) {
      // Check if userId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.createdBy = userId;
      } else {
        return res.status(400).json({ error: 'Invalid userId format' });
      }
    }

    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'email role trustName adminName name')
      .populate('category', 'name icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error('Get Campaigns Error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch campaigns' });
  }
};

// DELETE /api/campaigns/:id - Delete a campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ 
        message: 'Campaign not found' 
      });
    }

    // Check if the user is the creator of the campaign
    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You are not authorized to delete this campaign. Only the creator can delete it.' 
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'Campaign deleted successfully' 
    });
  } catch (err) {
    console.error('Delete Campaign Error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete campaign' });
  }
};

