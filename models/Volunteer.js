const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    trust: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Trust ID as ObjectId reference
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User who requested
    availability: { type: Map, of: [String], required: true },
    options: [{ type: String }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    remarks: { type: String } // Remarks from trust admin
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', volunteerSchema);
