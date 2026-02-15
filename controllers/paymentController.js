const Payment = require('../models/Payment');

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
            donorName,
            donorEmail,
            donorPhone
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
