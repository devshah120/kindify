const Post = require('../models/Post');

// Create Post
exports.createPost = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    // Handle multiple images (max 5)
    let pictures = [];
    if (req.files && req.files.length > 0) {
      pictures = req.files.map(file => `/uploads/posts/${file.filename}`);
    }

    const newPost = await Post.create({
      name,
      location,
      pictures,  // store array of images
      createdBy: req.user.id // assuming JWT middleware adds `req.user`
    });

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (err) {
    console.error('Create Post Error:', err);
    res.status(500).json({ error: err.message });
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
      .select('name location picture likedBy savedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('likedBy', 'id name')   // Populate likedBy user info
      .populate('savedBy', 'id name');  // Populate savedBy user info

    const totalPosts = await Post.countDocuments(filter);

    const postsWithCounts = posts.map(post => ({
      _id: post._id,
      name: post.name,
      location: post.location,
      picture: post.picture,
      likedBy: post.likedBy,             // Array of users who liked
      savedBy: post.savedBy,             // Array of users who saved
      totalLikes: post.likedBy.length,
      totalSaves: post.savedBy.length
    }));

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts: postsWithCounts
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Like a Post
exports.likePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;

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
    const { postId, userId } = req.body;

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
    const { postId, userId } = req.body;

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
    const { postId, userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
    await post.save();

    res.json({ success: true, message: 'Post unsaved successfully', totalSaves: post.savedBy.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
