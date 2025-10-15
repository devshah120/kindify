const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  trustName: String,
  adminName: String,
  name: String, // For regular users
  mobile: { type: String, required: false },
  phone: { type: String, required: false }, // Additional phone field
  darpanId: String,
  darpanCertificate: String, // store file name
  profilePhoto: { type: String, required: false }, // Profile photo filename
  designation: { type: String , required: false},               // Food Donator
  address: { type: String, required: false },
  state: { type: String, required: false },
  city: { type: String, required: false },
  pincode: { type: String, required: false },
  fullAddress: { type: String, required: false },
  email: { type: String, lowercase: true, trim: true, required: true, unique: true },
  role: {
  type: String,
  enum: ['Trust', 'User', 'Admin'], 
  default: 'User'
},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
