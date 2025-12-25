const Story = require('../models/Story');
const { deleteFromCloudinary } = require('../config/cloudinary');
const User = require('../models/User');
const { sendNotificationToRole } = require('../services/notificationService');

exports.createStory = async (req, res) => {
  try {
    const { title, isUserStory } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Cloudinary URL

    // Ensure title is provided
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Ensure createdBy field (authentication)
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: 'User is not authenticated' });
    }

    // Create the new story
    const newStory = new Story({
      title,
      imageUrl,
      isUserStory: isUserStory || false, // default to false
      createdBy: req.user.id, // Set the creator based on authenticated user
    });

    // Save the story to the database
    await newStory.save();

    // Get creator info for notification
    const creator = await User.findById(req.user.id).select('trustName adminName name role');
    const creatorName = creator.role === 'Trust' ? creator.trustName : creator.name;

    // Send notification to all users about the new story
    try {
      await sendNotificationToRole(
        'User', // Only send to users with role "User", not "Trust"
        'New Story Available! 📖',
        `${creatorName} shared a new story: ${title}`,
        {
          type: 'new_story',
          storyId: newStory._id.toString(),
          creatorName: creatorName
        }
      );
      console.log(`✅ Notification sent to all users about new story: ${newStory._id}`);
    } catch (notificationError) {
      console.error('❌ Error sending story notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      story: newStory
    });

  } catch (err) {
    console.error('Error creating story:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// Get all stories with optional filters (pagination, search, etc.)
exports.getStories = async (req, res) => {
  try {
    // Fetch all stories without any pagination or filtering
    const stories = await Story.find({})
      .select('_id title imageUrl isUserStory createdBy createdAt')
      .populate('createdBy', 'trustName adminName name email role profilePhoto')
      .sort({ createdAt: -1 }); // Sort by creation date, most recent first

    // Format stories with user info
    const formattedStories = stories.map(story => {
      const creator = story.createdBy;
      const creatorName = creator?.role === 'Trust' ? creator.trustName : creator?.name || 'Unknown';
      
      return {
        _id: story._id,
        title: story.title,
        imageUrl: story.imageUrl,
        isUserStory: story.isUserStory,
        createdBy: creator ? {
          _id: creator._id,
          name: creatorName,
          email: creator.email,
          role: creator.role,
          profilePhoto: creator.profilePhoto || null
        } : null,
        createdAt: story.createdAt
      };
    });

    res.status(200).json({
      success: true,
      stories: formattedStories
    });

  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ 
        success: false, 
        message: 'Story not found' 
      });
    }

    // Delete the image from Cloudinary
    if (story.imageUrl) {
      await deleteFromCloudinary(story.imageUrl);
    }

    await Story.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      success: true, 
      message: 'Story deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting story:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
