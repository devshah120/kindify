const Campaign = require('../models/Campaign');

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
        goal === undefined || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields. Required: campaignTitle, startDate, endDate, category, minAmount, maxAmount, goal, description' 
      });
    }

    // Validate campaignTitle length
    if (campaignTitle.length > 50) {
      return res.status(400).json({ message: 'campaignTitle must be 50 characters or less' });
    }

    // Validate description length
    if (description.length > 200) {
      return res.status(400).json({ message: 'description must be 200 characters or less' });
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
      description,
      createdBy: req.user.id // Track creator
    });

    // Populate creator info
    await campaign.populate('createdBy', 'email role trustName adminName name');

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
    let { page = 1, limit = 10, category } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (category) {
      query.category = category;
    }

    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'email role trustName adminName name')
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

