const Payment = require('../models/Payment');
const User = require('../models/User');

exports.savePayment = async (req, res) => {
    try {
        const {
            paymentId,
            amount,
            currency,
            status,
            trustId,
            trustName,
            campaignId,
            campaignTitle,
            donorId,
            donorName,
            donorEmail,
            donorPhone
        } = req.body;

        let finalDonorName = donorName;
        let finalDonorEmail = donorEmail;
        let finalDonorPhone = donorPhone;

        // If donorId is provided but details are missing, look them up in DB
        if (donorId && (!finalDonorName || !finalDonorEmail || !finalDonorPhone)) {
            const user = await User.findById(donorId).select('name trustName adminName email mobile phone');
            if (user) {
                finalDonorName = finalDonorName || user.name || 'Donor';
                finalDonorEmail = finalDonorEmail || user.email;
                finalDonorPhone = finalDonorPhone || user.mobile || user.phone;
            }
        }

        const newPayment = new Payment({
            paymentId,
            amount,
            currency,
            status,
            trustId,
            trustName,
            campaignId,
            campaignTitle,
            donorId,
            donorName: finalDonorName,
            donorEmail: finalDonorEmail,
            donorPhone: finalDonorPhone
        });

        await newPayment.save();

        res.status(201).json({ message: 'Payment saved successfully', payment: newPayment });
    } catch (error) {
        console.error('Error saving payment:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.getPaymentsByTrust = async (req, res) => {
    try {
        const { trustId } = req.params;
        const payments = await Payment.find({ trustId }).sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
