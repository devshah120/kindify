const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middlewares/auth');

// Get profile details (requires login)
router.get('/profile/:userId', auth, profileController.getProfile);

// Get posts for a specific profile (requires login)
router.get('/profile/:userId/posts', auth, profileController.getProfilePosts);

// Edit profile (requires login and ownership)
router.put('/profile/:userId', auth, profileController.editProfile);

module.exports = router;
