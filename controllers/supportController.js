const User = require('../models/User');
const { sendNotificationToUser } = require('../services/notificationService');

// Support a user/trust (Follow) - Same logic as save/unsave
exports.supportUser = async (req, res) => {
  try {
    const { trustId } = req.body; // User/Trust to support
    const userId = req.user.id; // Get from authenticated user

    if (!trustId) {
      return res.status(400).json({ message: 'Trust ID is required' });
    }

    // Check if trust/user exists
    const trustUser = await User.findById(trustId);
    if (!trustUser) {
      return res.status(404).json({ message: 'User/Trust not found' });
    }

    // Check if already supporting
    if (trustUser.supportedBy && trustUser.supportedBy.includes(userId)) {
      return res.status(400).json({ message: 'Already supporting this user/trust' });
    }

    // Add supporter to the array
    if (!trustUser.supportedBy) {
      trustUser.supportedBy = [];
    }
    trustUser.supportedBy.push(userId);
    await trustUser.save();

    // Get supporter info
    const supporter = await User.findById(userId).select('name trustName adminName role');
    const supporterName = supporter.role === 'Trust' ? supporter.trustName : supporter.name;
    const trustUserName = trustUser.role === 'Trust' ? trustUser.trustName : trustUser.name;

    // Send notification to the trust/user being supported
    try {
      await sendNotificationToUser(
        trustId,
        'New Supporter! 🎉',
        `${supporterName} started supporting you`,
        {
          type: 'new_supporter',
          supporterId: userId.toString(),
          supporterName: supporterName
        }
      );
      console.log(`✅ Notification sent to ${trustUserName} about new supporter: ${supporterName}`);
    } catch (notificationError) {
      console.error('❌ Error sending supporter notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully started supporting',
      totalSupporters: trustUser.supportedBy.length
    });

  } catch (error) {
    console.error('Support User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Unsupport a user/trust (Unfollow) - Same logic as unsave
exports.unsupportUser = async (req, res) => {
  try {
    const { trustId } = req.body; // User/Trust to unsupport
    const userId = req.user.id; // Get from authenticated user

    if (!trustId) {
      return res.status(400).json({ message: 'Trust ID is required' });
    }

    // Find the trust/user
    const trustUser = await User.findById(trustId);
    if (!trustUser) {
      return res.status(404).json({ message: 'User/Trust not found' });
    }

    // Remove supporter from the array
    if (!trustUser.supportedBy || !trustUser.supportedBy.includes(userId)) {
      return res.status(404).json({ message: 'Support relationship not found' });
    }

    trustUser.supportedBy = trustUser.supportedBy.filter(id => id.toString() !== userId);
    await trustUser.save();

    res.status(200).json({
      success: true,
      message: 'Successfully stopped supporting',
      totalSupporters: trustUser.supportedBy.length
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

    // Find all users/trusts where this user's ID is in their supportedBy array
    const supporting = await User.find({ supportedBy: userId })
      .select('trustName adminName name email role profilePhoto designation city state createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalSupporting = await User.countDocuments({ supportedBy: userId });

    const supportingList = supporting.map(user => ({
      user: {
        id: user._id,
        name: user.role === 'Trust' ? user.trustName : user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
        designation: user.designation || null,
        city: user.city || null,
        state: user.state || null
      }
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

    // Find the user/trust
    const trustUser = await User.findById(trustId);
    if (!trustUser) {
      return res.status(404).json({ message: 'User/Trust not found' });
    }

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Get supporters from the supportedBy array
    const supporterIds = trustUser.supportedBy || [];
    const totalSupporters = supporterIds.length;

    // Get paginated supporter IDs
    const paginatedIds = supporterIds.slice(skip, skip + limit);

    // Populate supporter user details
    const supporters = await User.find({ _id: { $in: paginatedIds } })
      .select('trustName adminName name email role profilePhoto designation city state createdAt');

    const supportersList = supporters.map(user => ({
      user: {
        id: user._id,
        name: user.role === 'Trust' ? user.trustName : user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || null,
        designation: user.designation || null,
        city: user.city || null,
        state: user.state || null
      }
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

    // Count how many users this user is supporting (users where userId is in their supportedBy array)
    const supportingCount = await User.countDocuments({ supportedBy: userId });

    // Count how many supporters this user has (from their own supportedBy array)
    const user = await User.findById(userId);
    const supportersCount = user?.supportedBy?.length || 0;

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

    // Find the trust/user and check if userId is in their supportedBy array
    const trustUser = await User.findById(trustId);
    if (!trustUser) {
      return res.status(404).json({ message: 'User/Trust not found' });
    }

    const isSupporting = trustUser.supportedBy && trustUser.supportedBy.includes(userId);

    res.status(200).json({
      success: true,
      isSupporting: !!isSupporting
    });

  } catch (error) {
    console.error('Check Support Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

