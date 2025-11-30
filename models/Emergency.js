const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientAge: { type: Number, required: true },
  patientId: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  requiredQty: { type: Number, required: true },
  relativeNumber: { type: String, required: true },
  relativeAlternateNumber: { type: String, required: false },
  hospitalName: { type: String, required: true },
  iAccept: { type: Boolean, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Emergency', emergencySchema);

