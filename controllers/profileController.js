const User = require('../models/User');
const Post = require('../models/Post');
const Support = require('../models/Support');
const Supporter = require('../models/Supporter');

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('trustName designation address')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const postCount = await Post.countDocuments({ createdBy: userId });
    const supporterCount = await Supporter.countDocuments({ trustId: userId });
    const supportCount = await Support.countDocuments({ trustId: userId });

    res.json({
      name: user.trustName,
      designation: user.designation || 'Food Donator',
      address: user.address || 'Ahmedabad',
      postCount,
      supporterCount,
      supportCount
    });
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
      .select('name location picture likedBy createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ createdBy: userId });

    res.json({
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      posts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
