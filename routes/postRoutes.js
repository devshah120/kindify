const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/uploadPostImages'); // multer instance

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

// Create post with any number of images
router.post('/posts', auth, upload.array('images', 10), handleMulterError, postController.createPost);
router.get('/posts', auth, postController.getPosts);
router.get('/posts/saved', auth, postController.getSavedPosts);
router.post('/post/like', auth, postController.likePost);
router.post('/post/unlike', auth, postController.unlikePost);
router.post('/post/save', auth, postController.savePost);
router.post('/post/unsave', auth, postController.unsavePost);

module.exports = router;
