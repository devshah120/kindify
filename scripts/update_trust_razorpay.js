const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const updateTrustCredentials = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const trustName = "KnovosFamily";
        const razorpayKey = "rzp_live_RpWW6EobV8tsoz";
        const razorpaySecret = "FQ2m2hJO3qk6y45ADDf24HW3";

        // Find the trust by name
        const trust = await User.findOne({ trustName: trustName, role: 'Trust' });

        if (!trust) {
            console.log(`Trust with name "${trustName}" not found.`);
            process.exit(1);
        }

        console.log(`Found Trust: ${trust.trustName} (_id: ${trust._id})`);

        // Update credentials
        trust.razorpayKey = razorpayKey;
        trust.razorpaySecret = razorpaySecret;

        await trust.save();

        console.log(`Successfully updated Razorpay credentials for "${trustName}"`);
        console.log(`Key ID: ${razorpayKey}`);
        console.log(`Key Secret: ${razorpaySecret}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error updating trust credentials:', error);
        process.exit(1);
    }
};

updateTrustCredentials();
