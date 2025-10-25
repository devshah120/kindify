const Supporter = require('../models/Supporter');
const User = require('../models/User');

// Support a user/trust (Follow)
exports.supportUser = async (req, res) => {
  try {
    const supporterId = req.user.id; // Logged-in user
    const { trustId } = req.body; // User/Trust to support

    if (!trustId) {
      return res.status(400).json({ message: 'Trust ID is required' });
    }

    // Check if trust/user exists
    const trustUser = await User.findById(trustId);
    if (!trustUser) {
      return res.status(404).json({ message: 'User/Trust not found' });
    }

    // Check if already supporting
    const existingSupport = await Supporter.findOne({ trustId, userId: supporterId });
    if (existingSupport) {
      return res.status(400).json({ message: 'Already supporting this user/trust' });
    }

    // Create new support relationship
    const newSupporter = await Supporter.create({
      trustId,
      userId: supporterId
    });

    res.status(201).json({
      success: true,
      message: 'Successfully started supporting',
      supporter: newSupporter
    });

  } catch (error) {
    console.error('Support User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Unsupport a user/trust (Unfollow)
exports.unsupportUser = async (req, res) => {
  try {
    const supporterId = req.user.id; // Logged-in user
    const { trustId } = req.body; // User/Trust to unsupport

    if (!trustId) {
      return res.status(400).json({ message: 'Trust ID is required' });
    }

    // Remove support relationship
    const result = await Supporter.findOneAndDelete({ trustId, userId: supporterId });

    if (!result) {
      return res.status(404).json({ message: 'Support relationship not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully stopped supporting'
    });

  } catch (error) {
    console.error('Unsupport User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Get list of users/trusts the logged-in user is supporting (Following)
exports.getSupporting = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Find all users/trusts this user is supporting
    const supporting = await Supporter.find({ userId })
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('trustId', 'trustName adminName name email role profilePhoto designation city state');

    const totalSupporting = await Supporter.countDocuments({ userId });

    const supportingList = supporting.map(support => ({
      _id: support._id,
      user: {
        id: support.trustId._id,
        name: support.trustId.role === 'Trust' ? support.trustId.trustName : support.trustId.name,
        email: support.trustId.email,
        role: support.trustId.role,
        profilePhoto: support.trustId.profilePhoto,
        designation: support.trustId.designation,
        city: support.trustId.city,
        state: support.trustId.state
      },
      joinedAt: support.joinedAt
    }));

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalSupporting / limit),
      totalSupporting,
      supporting: supportingList
    });

  } catch (error) {
    console.error('Get Supporting Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Get list of supporters for a user/trust (Followers)
exports.getSupporters = async (req, res) => {
  try {
    const { trustId } = req.params; // User/Trust whose supporters we want to see

    if (!trustId) {
      return res.status(400).json({ message: 'Trust ID is required' });
    }

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Find all supporters of this user/trust
    const supporters = await Supporter.find({ trustId })
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'trustName adminName name email role profilePhoto designation city state');

    const totalSupporters = await Supporter.countDocuments({ trustId });

    const supportersList = supporters.map(support => ({
      _id: support._id,
      user: {
        id: support.userId._id,
        name: support.userId.role === 'Trust' ? support.userId.trustName : support.userId.name,
        email: support.userId.email,
        role: support.userId.role,
        profilePhoto: support.userId.profilePhoto,
        designation: support.userId.designation,
        city: support.userId.city,
        state: support.userId.state
      },
      joinedAt: support.joinedAt
    }));

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalSupporters / limit),
      totalSupporters,
      supporters: supportersList
    });

  } catch (error) {
    console.error('Get Supporters Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Get support stats for logged-in user
exports.getSupportStats = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user

    // Count how many users this user is supporting
    const supportingCount = await Supporter.countDocuments({ userId });

    // Count how many supporters this user has
    const supportersCount = await Supporter.countDocuments({ trustId: userId });

    res.status(200).json({
      success: true,
      stats: {
        supporting: supportingCount,
        supporters: supportersCount
      }
    });

  } catch (error) {
    console.error('Get Support Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Check if logged-in user is supporting a specific user/trust
exports.checkSupportStatus = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user
    const { trustId } = req.params; // User/Trust to check

    if (!trustId) {
      return res.status(400).json({ message: 'Trust ID is required' });
    }

    const isSupporting = await Supporter.findOne({ trustId, userId });

    res.status(200).json({
      success: true,
      isSupporting: !!isSupporting
    });

  } catch (error) {
    console.error('Check Support Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

