const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name: String,
  location: String,
  pictures: [{ type: String }],                   // array of Cloudinary URLs
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
