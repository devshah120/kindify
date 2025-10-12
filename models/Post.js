const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name: { type: String, required: true },           // Post title
  location: { type: String },                       // e.g. Gujarat
  picture: { type: String },                        // Single image URL (for backward compatibility)
  pictures: [{ type: String }],                     // Array of image URLs (new field)
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // Users who saved
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
