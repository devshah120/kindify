const Post = require('../models/Post');
const { deleteFromCloudinary } = require('../config/cloudinary');
const User = require('../models/User');
const { sendNotificationToRole, sendNotificationToUser } = require('../services/notificationService');

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

    // Get creator info for notification
    const creator = await User.findById(req.user.id).select('trustName adminName name role');
    const creatorName = creator.role === 'Trust' ? creator.trustName : creator.name;

    // Send notification to all users (not Trust) about the new post
    try {
      await sendNotificationToRole(
        'User', // Only send to users with role "User", not "Trust"
        'New Post Available! 🎉',
        `${creatorName} shared a new post: ${creator.trustName ?? creator.name}`,
        {
          type: 'new_post',
          postId: newPost._id.toString(),
          creatorName: creatorName,
          location: location
        }
      );
      console.log(`✅ Notification sent to all users about new post: ${newPost._id}`);
    } catch (notificationError) {
      // Log error but don't fail the post creation
      console.error('❌ Error sending post notification:', notificationError);
    }

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

    // Get support relationships for current user (if authenticated) - Same logic as save/unsave
    const userId = req.user?.id;
    let supportMap = {};
    let creatorSupportersMap = {}; // Map to store supportedBy arrays for each creator
    
    if (posts.length > 0) {
      const creatorIds = posts
        .filter(post => post.createdBy && post.createdBy._id)
        .map(post => post.createdBy._id.toString());
      
      if (creatorIds.length > 0) {
        // Fetch creators with their supportedBy arrays
        const creators = await User.find({ _id: { $in: creatorIds } })
          .select('_id supportedBy');
        
        creators.forEach(creator => {
          const creatorIdStr = creator._id.toString();
          creatorSupportersMap[creatorIdStr] = creator.supportedBy || [];
          
          // Check if current user is supporting this creator
          if (userId && creator.supportedBy && creator.supportedBy.includes(userId)) {
            supportMap[creatorIdStr] = true;
          }
        });
      }
    }

    const postsWithCounts = posts.map(post => {
      const creatorName = post.createdBy.role === 'Trust' ? post.createdBy.trustName : post.createdBy.name;
      const creatorId = post.createdBy._id.toString();
      const isSupporting = userId ? !!supportMap[creatorId] : false;  // Boolean: true if current user is supporting the creator
      const supportedBy = creatorSupportersMap[creatorId] || [];  // Array of supporter IDs
      
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
        isSupporting: isSupporting,  // Boolean: true if current user is supporting this creator
        supportedBy: supportedBy,  // Array of user IDs who support this creator
        totalSupporters: supportedBy.length,  // Count of supporters
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

    const post = await Post.findById(postId).populate('createdBy', 'trustName adminName name role _id');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const wasAlreadyLiked = post.likedBy.includes(userId);
    
    if (!wasAlreadyLiked) {
      post.likedBy.push(userId);
      await post.save();

      // Send notification to Trust when user likes their post (only if Trust created it)
      if (post.createdBy && post.createdBy.role === 'Trust' && post.createdBy._id) {
        try {
          const user = await User.findById(userId).select('name trustName adminName role');
          const userName = user?.name || 'Someone';
          
          await sendNotificationToUser(
            post.createdBy._id,
            'Your Post Got a Like! ❤️',
            `${userName} liked your post: ${post.name}`,
            {
              type: 'post_liked',
              postId: post._id.toString(),
              userId: userId.toString(),
              userName: userName
            }
          );
          console.log(`✅ Notification sent to Trust about post like: ${post._id}`);
        } catch (notificationError) {
          console.error('❌ Error sending post like notification:', notificationError);
        }
      }
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

    const post = await Post.findById(postId).populate('createdBy', 'trustName adminName name role _id');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const wasAlreadySaved = post.savedBy.includes(userId);
    
    if (!wasAlreadySaved) {
      post.savedBy.push(userId);
      await post.save();

      // Send notification to Trust when user saves their post (only if Trust created it)
      if (post.createdBy && post.createdBy.role === 'Trust' && post.createdBy._id) {
        try {
          const user = await User.findById(userId).select('name trustName adminName role');
          const userName = user?.name || 'Someone';
          
          await sendNotificationToUser(
            post.createdBy._id,
            'Your Post Was Saved! 🔖',
            `${userName} saved your post: ${post.name}`,
            {
              type: 'post_saved',
              postId: post._id.toString(),
              userId: userId.toString(),
              userName: userName
            }
          );
          console.log(`✅ Notification sent to Trust about post save: ${post._id}`);
        } catch (notificationError) {
          console.error('❌ Error sending post save notification:', notificationError);
        }
      }
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

    // Get support relationships for current user - Same logic as save/unsave
    let supportMap = {};
    let creatorSupportersMap = {}; // Map to store supportedBy arrays for each creator
    
    if (savedPosts.length > 0) {
      const creatorIds = savedPosts
        .filter(post => post.createdBy && post.createdBy._id)
        .map(post => post.createdBy._id.toString());
      
      if (creatorIds.length > 0) {
        // Fetch creators with their supportedBy arrays
        const creators = await User.find({ _id: { $in: creatorIds } })
          .select('_id supportedBy');
        
        creators.forEach(creator => {
          const creatorIdStr = creator._id.toString();
          creatorSupportersMap[creatorIdStr] = creator.supportedBy || [];
          
          // Check if current user is supporting this creator
          if (creator.supportedBy && creator.supportedBy.includes(userId)) {
            supportMap[creatorIdStr] = true;
          }
        });
      }
    }

    const postsWithCounts = savedPosts.map(post => {
      const creatorName = post.createdBy.role === 'Trust' ? post.createdBy.trustName : post.createdBy.name;
      const creatorId = post.createdBy._id.toString();
      const isSupporting = !!supportMap[creatorId];  // Boolean: true if current user is supporting the creator
      const supportedBy = creatorSupportersMap[creatorId] || [];  // Array of supporter IDs
      
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
        isSupporting: isSupporting,  // Boolean: true if current user is supporting this creator
        supportedBy: supportedBy,  // Array of user IDs who support this creator
        totalSupporters: supportedBy.length,  // Count of supporters
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

// Search posts
exports.searchPosts = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    };

    const posts = await Post.find(searchFilter)
      .select('name location pictures categoryId likedBy savedBy createdBy createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'trustName adminName name email role')
      .populate('categoryId', 'name icon')
      .populate('likedBy', '_id name trustName adminName')
      .populate('savedBy', '_id name trustName adminName');

    const totalPosts = await Post.countDocuments(searchFilter);

    const userId = req.user?.id;
    let supportMap = {};
    let creatorSupportersMap = {};
    
    if (posts.length > 0) {
      const creatorIds = posts
        .filter(post => post.createdBy && post.createdBy._id)
        .map(post => post.createdBy._id.toString());
      
      if (creatorIds.length > 0) {
        const creators = await User.find({ _id: { $in: creatorIds } })
          .select('_id supportedBy');
        
        creators.forEach(creator => {
          const creatorIdStr = creator._id.toString();
          creatorSupportersMap[creatorIdStr] = creator.supportedBy || [];
          
          if (userId && creator.supportedBy && creator.supportedBy.includes(userId)) {
            supportMap[creatorIdStr] = true;
          }
        });
      }
    }

    const postsWithCounts = posts.map(post => {
      const creatorName = post.createdBy.role === 'Trust' ? post.createdBy.trustName : post.createdBy.name;
      const creatorId = post.createdBy._id.toString();
      const isSupporting = userId ? !!supportMap[creatorId] : false;
      const supportedBy = creatorSupportersMap[creatorId] || [];
      
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
        isSupporting: isSupporting,
        supportedBy: supportedBy,
        totalSupporters: supportedBy.length,
        createdAt: post.createdAt,
        likedBy: post.likedBy,
        savedBy: post.savedBy,
        totalLikes: post.likedBy.length,
        totalSaves: post.savedBy.length
      };
    });

    res.status(200).json({
      success: true,
      query: query,
      currentPage: pageNum,
      totalPages: Math.ceil(totalPosts / limitNum),
      totalPosts,
      posts: postsWithCounts
    });

  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
