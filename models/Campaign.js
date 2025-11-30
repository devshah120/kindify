const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  campaignTitle: { type: String, maxlength: 50, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  category: { type: String, required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  goal: { type: Number, required: true },
  description: { type: String, maxlength: 200, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campaign', campaignSchema);

