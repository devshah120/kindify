const express = require('express');
const router = express.Router();
const uploadStory = require('../middlewares/uploadStory'); // Import the upload middleware
const auth = require('../middlewares/auth'); // JWT auth
const storyController = require('../controllers/storyController');

// Create a new story with image upload
router.post('/stories',auth, uploadStory.single('imageUrl'), storyController.createStory);

// Get all stories with pagination
router.get('/stories',auth, storyController.getStories);

// Delete story
router.delete('/stories/:id', auth, storyController.deleteStory);

module.exports = router;
