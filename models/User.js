const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  trustName: String,
  adminName: String,
  name: String, // For regular users
  mobile: { type: String, required: false },
  darpanId: String,
  darpanCertificate: String, // store file name
  designation: { type: String , required: false},               // Food Donator
  address: { type: String, required: false },
  email: { type: String, lowercase: true, trim: true, required: true, unique: true },
  role: {
  type: String,
  enum: ['Trust', 'User', 'Admin'], 
  default: 'User'
},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
