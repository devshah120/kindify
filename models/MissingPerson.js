const mongoose = require('mongoose');

const missingPersonSchema = new mongoose.Schema({
  userImage: { type: String, required: true }, // Cloudinary URL
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  age: { type: Number, required: true },
  sex: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  race: { type: String, required: false },
  height: { type: String, required: false },
  weight: { type: Number, required: true },
  hairColor: { type: String, required: true },
  eyeColor: { type: String, required: true },
  clothLastWorn: { type: String, required: true },
  identifyingMarks: { type: String, required: true },
  lastSeenDate: { type: Date, required: true },
  additionalRemarks: { type: String, maxlength: 200, required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MissingPerson', missingPersonSchema);

