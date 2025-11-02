const Story = require('../models/Story');

exports.createStory = async (req, res) => {
  try {
    const { title, isUserStory } = req.body;
    const imageUrl = req.file ? `/uploads/stories/${req.file.filename}` : null;

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
      .select('id title imageUrl isUserStory createdBy createdAt') // Include createdBy field
      .populate('createdBy', 'username email') // Populating the `createdBy` field with user data (you can change this to other user fields as necessary)
      .sort({ createdAt: -1 }); // Sort by creation date, most recent first

    res.status(200).json({
      success: true,
      stories
    });

  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
