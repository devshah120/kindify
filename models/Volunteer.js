const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    trust: { type: String, required: true },
    availability: { type: Map, of: [String], required: true },
    options: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
