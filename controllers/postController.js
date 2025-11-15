const Post = require('../models/Post');
const { deleteFromCloudinary } = require('../config/cloudinary');
const Supporter = require('../models/Supporter');

// Create Post
exports.createPost = async (req, res) => {
  try {
    const { name, location, categoryId } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    // Get images from multer (similar to story but supports multiple images)
    let pictures = [];
    if (req.files && req.files.length > 0) {
      pictures = req.files.map(file => file.path); // Cloudinary URL
    } else if (req.file) {
      pictures = [req.file.path]; // Cloudinary URL (fallback for single file)
    }

    if (pictures.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const newPost = await Post.create({
      name,
      location,
      pictures,                // array of images
      categoryId: categoryId || null,  // category ID (optional)
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (err) {
    console.error('Create Post Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create post' });
  }
};

// Get Posts with likes and saves info
exports.getPosts = async (req, res) => {
  try {
    let { page = 1, limit = 10, query } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let filter = {};
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const posts = await Post.find(filter)
      .select('name location pictures categoryId likedBy savedBy createdBy createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'trustName adminName name email role')  // Populate creator info
      .populate('categoryId', 'name icon')  // Populate category info
      .populate('likedBy', '_id name trustName adminName')   // Populate likedBy user info
      .populate('savedBy', '_id name trustName adminName');  // Populate savedBy user info

    const totalPosts = await Post.countDocuments(filter);

    // Get support relationships for current user (if authenticated)
    const userId = req.user?.id;
    let supportMap = {};
    if (userId && posts.length > 0) {
      const creatorIds = posts
        .filter(post => post.createdBy && post.createdBy._id)
        .map(post => post.createdBy._id.toString());
      
      if (creatorIds.length > 0) {
        const supports = await Supporter.find({ 
          userId: userId, 
          trustId: { $in: creatorIds } 
        });
        supports.forEach(support => {
          supportMap[support.trustId.toString()] = support._id.toString();
        });
      }
    }

    const postsWithCounts = posts.map(post => {
      const creatorName = post.createdBy.role === 'Trust' ? post.createdBy.trustName : post.createdBy.name;
      const creatorId = post.createdBy._id.toString();
      const supportId = userId ? supportMap[creatorId] || null : null;
      const isSupporting = !!supportId;  // Boolean: true if current user is supporting the creator
      
      return {
        _id: post._id,
        name: creatorName,
        postTitle: post.name,
        location: post.location,
        pictures: post.pictures,
        categoryId: post.categoryId ? {
          _id: post.categoryId._id,
          name: post.categoryId.name,
          icon: post.categoryId.icon
        } : null,
        createdBy: {
          id: post.createdBy._id,
          name: creatorName,
          email: post.createdBy.email,
          role: post.createdBy.role
        },
        supportId: supportId,  // Supporter document ID (for unsupport operation), null if not supporting
        isSupporting: isSupporting,  // Boolean: true if current user is supporting this creator
        createdAt: post.createdAt,
        likedBy: post.likedBy,
        savedBy: post.savedBy,
        totalLikes: post.likedBy.length,
        totalSaves: post.savedBy.length
      };
    });

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts: postsWithCounts
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Like a Post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id; // Get from authenticated user

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.likedBy.includes(userId)) {
      post.likedBy.push(userId);
      await post.save();
    }

    res.json({ success: true, message: 'Post liked successfully', totalLikes: post.likedBy.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Unlike a Post
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id; // Get from authenticated user

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
    await post.save();

    res.json({ success: true, message: 'Post unliked successfully', totalLikes: post.likedBy.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Save a Post
exports.savePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id; // Get from authenticated user

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.savedBy.includes(userId)) {
      post.savedBy.push(userId);
      await post.save();
    }

    res.json({ success: true, message: 'Post saved successfully', totalSaves: post.savedBy.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Unsave a Post
exports.unsavePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id; // Get from authenticated user

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
    await post.save();

    res.json({ success: true, message: 'Post unsaved successfully', totalSaves: post.savedBy.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Get Saved Posts by User
exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from authenticated user

    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Find all posts where the user's ID is in the savedBy array
    const savedPosts = await Post.find({ savedBy: userId })
      .select('name location pictures categoryId likedBy savedBy createdBy createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'trustName adminName name email role')
      .populate('categoryId', 'name icon')
      .populate('likedBy', '_id name trustName adminName')
      .populate('savedBy', '_id name trustName adminName');

    const totalSavedPosts = await Post.countDocuments({ savedBy: userId });

    // Get support relationships for current user
    let supportMap = {};
    if (savedPosts.length > 0) {
      const creatorIds = savedPosts
        .filter(post => post.createdBy && post.createdBy._id)
        .map(post => post.createdBy._id.toString());
      
      if (creatorIds.length > 0) {
        const supports = await Supporter.find({ 
          userId: userId, 
          trustId: { $in: creatorIds } 
        });
        supports.forEach(support => {
          supportMap[support.trustId.toString()] = support._id.toString();
        });
      }
    }

    const postsWithCounts = savedPosts.map(post => {
      const creatorName = post.createdBy.role === 'Trust' ? post.createdBy.trustName : post.createdBy.name;
      const creatorId = post.createdBy._id.toString();
      const supportId = supportMap[creatorId] || null;
      const isSupporting = !!supportId;  // Boolean: true if current user is supporting the creator
      
      return {
        _id: post._id,
        name: creatorName,
        postTitle: post.name,
        location: post.location,
        pictures: post.pictures,
        categoryId: post.categoryId ? {
          _id: post.categoryId._id,
          name: post.categoryId.name,
          icon: post.categoryId.icon
        } : null,
        createdBy: {
          id: post.createdBy._id,
          name: creatorName,
          email: post.createdBy.email,
          role: post.createdBy.role
        },
        supportId: supportId,  // Supporter document ID (for unsupport operation), null if not supporting
        isSupporting: isSupporting,  // Boolean: true if current user is supporting this creator
        createdAt: post.createdAt,
        likedBy: post.likedBy,
        savedBy: post.savedBy,
        totalLikes: post.likedBy.length,
        totalSaves: post.savedBy.length
      };
    });

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalSavedPosts / limit),
      totalSavedPosts,
      posts: postsWithCounts
    });

  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Delete all images from Cloudinary
    if (post.pictures && post.pictures.length > 0) {
      for (const pictureUrl of post.pictures) {
        if (pictureUrl) {
          await deleteFromCloudinary(pictureUrl);
        }
      }
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
