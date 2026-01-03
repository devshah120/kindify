const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  campaignTitle: { type: String, maxlength: 50, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  goal: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },
  description: { type: String, required: false },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campaign', campaignSchema);

