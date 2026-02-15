const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true },
    orderId: { type: String }, // Razorpay Order ID
    signature: { type: String }, // Razorpay Signature
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, default: "success" },

    // Trust Details
    trustId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trustName: { type: String, required: true },

    // Campaign Details (Optional, if donation is for a specific campaign)
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    campaignTitle: { type: String },

    // Donor Details (Optional, if logged in)
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donorName: { type: String },
    donorEmail: { type: String },
    donorPhone: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
