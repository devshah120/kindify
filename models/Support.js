const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  trustId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, default: 0 }, // If monetary support
  message: { type: String },            // Optional message
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Support', supportSchema);
