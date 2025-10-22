const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name: String,
  location: String,
  picture: { type: String, default: null },      // first image or preview
  pictures: [{ type: String }],                   // array of image paths
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
