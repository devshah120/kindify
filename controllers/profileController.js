const User = require('../models/User');
const Post = require('../models/Post');
const { deleteFromCloudinary } = require('../config/cloudinary');

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('trustName adminName name email mobile phone darpanId profilePhoto designation address state city pincode fullAddress role createdAt supportedBy razorpayKey razorpaySecret')
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
      // For Trust: Count how many people are supporting them (from their supportedBy array)
      const supporterCount = user.supportedBy?.length || 0;
      // Trust doesn't save posts, so saveCount is 0
      const saveCount = 0;

      profileData = {
        ...profileData,
        trustName: user.trustName,
        adminName: user.adminName,
        mobile: user.mobile,
        darpanId: user.darpanId,
        profilePhoto: user.profilePhoto || null,
        designation: user.designation || 'Food Donator',
        address: user.address || 'Ahmedabad',
        state: user.state || null,
        city: user.city || null,
        pincode: user.pincode || null,
        fullAddress: user.fullAddress || null,
        razorpayKey: user.razorpayKey || null,
        razorpaySecret: user.razorpaySecret || null,
        postCount,
        supporterCount,
        saveCount
      };
    } else if (user.role === 'User') {
      // For User: Count how many NGOs/Trusts they are supporting
      // (count documents where userId is in supportedBy array)
      const supporterCount = await User.countDocuments({ supportedBy: userId });
      // For User: Count how many posts they have saved
      // (count documents where userId is in savedBy array)
      const saveCount = await Post.countDocuments({ savedBy: userId });

      profileData = {
        ...profileData,
        name: user.name || 'User',
        mobile: user.mobile,
        phone: user.phone,
        profilePhoto: user.profilePhoto || null,
        address: user.address,
        state: user.state,
        city: user.city,
        pincode: user.pincode,
        fullAddress: user.fullAddress,
        designation: user.designation,
        razorpayKey: user.razorpayKey || null,
        razorpaySecret: user.razorpaySecret || null,
        supporterCount,
        saveCount
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

    const { trustName, adminName, name, mobile, phone, darpanId, designation, address, state, city, pincode, fullAddress, email, razorpayKey, razorpaySecret } = requestBody;

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
      if (state !== undefined) updateFields.state = state;
      if (city !== undefined) updateFields.city = city;
      if (pincode !== undefined) updateFields.pincode = pincode;
      if (fullAddress !== undefined) updateFields.fullAddress = fullAddress;
      if (razorpayKey !== undefined) updateFields.razorpayKey = razorpayKey;
      if (razorpaySecret !== undefined) updateFields.razorpaySecret = razorpaySecret;
    } else if (user.role === 'User') {
      // Regular users can edit basic profile fields
      if (name !== undefined) updateFields.name = name;
      if (mobile !== undefined) updateFields.mobile = mobile;
      if (phone !== undefined) updateFields.phone = phone;
      if (designation !== undefined) updateFields.designation = designation;
      if (address !== undefined) updateFields.address = address;
      if (state !== undefined) updateFields.state = state;
      if (city !== undefined) updateFields.city = city;
      if (pincode !== undefined) updateFields.pincode = pincode;
      if (fullAddress !== undefined) updateFields.fullAddress = fullAddress;
      if (email !== undefined) updateFields.email = email;
      if (razorpayKey !== undefined) updateFields.razorpayKey = razorpayKey;
      if (razorpaySecret !== undefined) updateFields.razorpaySecret = razorpaySecret;

      // Users cannot edit trust-specific fields
      if (trustName !== undefined || adminName !== undefined || darpanId !== undefined) {
        return res.status(400).json({
          message: 'Invalid field for User role. trustName, adminName and darpanId are only for Trust accounts.'
        });
      }
    }

    // Handle profile photo upload if file is provided
    if (req.file) {
      // Delete old profile photo from Cloudinary if exists
      if (user.profilePhoto) {
        await deleteFromCloudinary(user.profilePhoto);
      }
      updateFields.profilePhoto = req.file.path; // Cloudinary URL
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
    ).select('trustName adminName name mobile phone darpanId profilePhoto designation address state city pincode fullAddress email role createdAt razorpayKey razorpaySecret');

    // Prepare response with profile photo URL
    const responseUser = {
      ...updatedUser.toObject(),
      profilePhoto: updatedUser.profilePhoto || null
    };

    res.json({
      message: 'Profile updated successfully',
      user: responseUser
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

// Get all users with "User" role
exports.getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Build query for users with "User" role
    let query = { role: 'User' };

    // Add search functionality if search query is provided
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users with pagination
    const users = await User.find(query)
      .select('name email mobile phone profilePhoto designation address state city pincode fullAddress role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name || 'User',
      email: user.email,
      mobile: user.mobile || null,
      phone: user.phone || null,
      profilePhoto: user.profilePhoto || null,
      designation: user.designation || null,
      address: user.address || null,
      state: user.state || null,
      city: user.city || null,
      pincode: user.pincode || null,
      fullAddress: user.fullAddress || null,
      role: user.role,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getRazorpayCredentials = async (req, res) => {
  try {
    const userId = req.query.trustId || req.user.id;

    const user = await User.findById(userId)
      .select('razorpayKey role')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      razorpayKey: user.razorpayKey || null
    });
  } catch (error) {
    console.error('Error fetching Razorpay credentials:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

