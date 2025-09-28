const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true, required: true },
  mobile: { type: String, trim: true, required: false },
  otp: { type: String, required: true },
  role: { type: String, enum: ['User', 'Trust'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index: documents expire after OTP_EXPIRE_SECONDS (fallback 300s)
const expireSeconds = parseInt(process.env.OTP_EXPIRE_SECONDS || '300', 10);
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: expireSeconds });

module.exports = mongoose.model('Otp', otpSchema);
