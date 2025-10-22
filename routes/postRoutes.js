const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/uploadPostImages'); // multer instance

// Create post with any number of images
router.post('/posts', auth, upload.array('images'), postController.createPost);
router.get('/posts', auth, postController.getPosts);
router.post('/post/like', auth, postController.likePost);
router.post('/post/unlike', auth, postController.unlikePost);
router.post('/post/save', auth, postController.savePost);
router.post('/post/unsave', auth, postController.unsavePost);

module.exports = router;
