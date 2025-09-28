const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middlewares/uploadPost'); // multer config
const auth = require('../middlewares/auth'); // JWT auth

// Create post
router.post('/post', auth, upload.single('picture'), postController.createPost);
router.get('/posts', auth, postController.getPosts);
router.post('/post/like', auth, postController.likePost);
router.post('/post/unlike', auth, postController.unlikePost);
router.post('/post/save', auth, postController.savePost);
router.post('/post/unsave', auth, postController.unsavePost);

module.exports = router;
