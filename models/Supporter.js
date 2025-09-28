const mongoose = require('mongoose');

const supporterSchema = new mongoose.Schema({
  trustId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supporter', supporterSchema);
