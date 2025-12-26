const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middlewares/auth');
const uploadProfilePhoto = require('../middlewares/uploadProfilePhoto');

// Get profile details (requires login)
router.get('/profile/:userId', auth, profileController.getProfile);

// Get posts for a specific profile (requires login)
router.get('/profile/:userId/posts', auth, profileController.getProfilePosts);

// Get all users with "User" role (requires login)
router.get('/users', auth, profileController.getAllUsers);

// Edit profile (requires login and ownership) - supports profile photo upload
router.post('/profile/:userId', auth, uploadProfilePhoto, profileController.editProfile);

module.exports = router;
