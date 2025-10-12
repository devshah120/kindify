const User = require('../models/User');
const Post = require('../models/Post');
const Support = require('../models/Support');
const Supporter = require('../models/Supporter');

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('trustName adminName name email mobile darpanId designation address role createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Different profile data based on user role
    let profileData = {
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    if (user.role === 'Trust') {
      const postCount = await Post.countDocuments({ createdBy: userId });
      const supporterCount = await Supporter.countDocuments({ trustId: userId });
      const supportCount = await Support.countDocuments({ trustId: userId });

      profileData = {
        ...profileData,
        trustName: user.trustName,
        adminName: user.adminName,
        mobile: user.mobile,
        darpanId: user.darpanId,
        designation: user.designation || 'Food Donator',
        address: user.address || 'Ahmedabad',
        postCount,
        supporterCount,
        supportCount
      };
    } else if (user.role === 'User') {
      // For regular users, show basic profile info
      profileData = {
        ...profileData,
        name: user.name || 'User',
        mobile: user.mobile,
        address: user.address,
        designation: user.designation
      };
    }

    res.json(profileData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfilePosts = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const posts = await Post.find({ createdBy: userId })
      .select('name location picture pictures likedBy savedBy createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'trustName adminName name email role')
      .populate('likedBy', 'id name')
      .populate('savedBy', 'id name')
      .lean();

    const totalPosts = await Post.countDocuments({ createdBy: userId });

    const postsWithUserInfo = posts.map(post => {
      const creatorName = post.createdBy.role === 'Trust' ? post.createdBy.trustName : post.createdBy.name;
      
      return {
        _id: post._id,
        name: creatorName, // Show creator's name instead of post title
        postTitle: post.name, // Keep original post title in separate field
        location: post.location,
        picture: post.picture,
        pictures: post.pictures,
        createdBy: {
          id: post.createdBy._id,
          name: creatorName,
          email: post.createdBy.email,
          role: post.createdBy.role
        },
        createdAt: post.createdAt,
        likedBy: post.likedBy,
        savedBy: post.savedBy,
        totalLikes: post.likedBy.length,
        totalSaves: post.savedBy.length
      };
    });

    res.json({
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      posts: postsWithUserInfo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Try to parse body if it's a string
    let requestBody = req.body;
    if (typeof req.body === 'string') {
      try {
        requestBody = JSON.parse(req.body);
      } catch (parseError) {
        return res.status(400).json({ message: 'Invalid JSON format' });
      }
    }
    
    const { trustName, adminName, name, mobile, darpanId, designation, address, email } = requestBody;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate that the user can only edit their own profile
    if (req.user.id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only edit their own profile.' });
    }

    // Prepare update object with only provided fields based on user role
    const updateFields = {};
    
    if (user.role === 'Trust') {
      // Trust users can edit all trust-related fields
      if (trustName !== undefined) updateFields.trustName = trustName;
      if (adminName !== undefined) updateFields.adminName = adminName;
      if (mobile !== undefined) updateFields.mobile = mobile;
      if (email !== undefined) updateFields.email = email;
      if (darpanId !== undefined) updateFields.darpanId = darpanId;
      if (designation !== undefined) updateFields.designation = designation;
      if (address !== undefined) updateFields.address = address;
    } else if (user.role === 'User') {
      // Regular users can edit basic profile fields
      if (name !== undefined) updateFields.name = name;
      if (mobile !== undefined) updateFields.mobile = mobile;
      if (designation !== undefined) updateFields.designation = designation;
      if (address !== undefined) updateFields.address = address;
      if (email !== undefined) updateFields.email = email;
      
      // Users cannot edit trust-specific fields
      if (trustName !== undefined || adminName !== undefined || darpanId !== undefined) {
        return res.status(400).json({ 
          message: 'Invalid field for User role. trustName, adminName and darpanId are only for Trust accounts.' 
        });
      }
    }

    // Check if updateFields is empty
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ 
        message: 'No valid fields to update for this user role' 
      });
    }

    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('trustName adminName name mobile darpanId designation address email role createdAt');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
