const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadPostImages = require('../middlewares/uploadPostImages'); // Import the upload middleware
const auth = require('../middlewares/auth'); // JWT auth
const postController = require('../controllers/postController');

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded. Maximum 10 files allowed.' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 10MB per file.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: `Unexpected file field: ${err.field}. Use field name 'images' for multiple files.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

// Create a new post with multiple image uploads (similar to story but supports multiple images)
router.post('/posts', auth, uploadPostImages.array('images', 10), handleMulterError, postController.createPost);
router.get('/posts', auth, postController.getPosts);
router.get('/posts/my-posts', auth, postController.getMyPosts);
router.get('/posts/saved', auth, postController.getSavedPosts);
router.post('/post/like', auth, postController.likePost);
router.post('/post/unlike', auth, postController.unlikePost);
router.post('/post/save', auth, postController.savePost);
router.post('/post/unsave', auth, postController.unsavePost);
router.delete('/posts/:id', auth, postController.deletePost);
router.get('/posts/search', auth, postController.searchPosts);
router.get('/posts/likes/:postId', auth, postController.getPostLikes);

module.exports = router;
