const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likedAt: { type: Date, default: Date.now }
}, { _id: false });

const postSchema = new mongoose.Schema({
  name: String,
  location: String,
  pictures: [{ type: String }],                   // array of Cloudinary URLs
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  likedBy: [likeSchema],  // Array of like objects with userId and likedAt
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
