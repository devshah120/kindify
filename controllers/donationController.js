// donationController.js
const Donation = require('../models/Donation');

// Create a new donation
exports.createDonation = async (req, res) => {
  try {
    const { categoryId, trustId, minAmount, maxAmount, description, options, selectedAmount } = req.body;

    const donation = new Donation({
      categoryId,
      trustId,
      minAmount,
      maxAmount,
      description,
      options,
      selectedAmount
    });

    await donation.save();
    res.status(201).json({ success: true, donation });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all donations
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('categoryId', 'name')
      .populate('trustId', 'trustName');
    res.status(200).json({ success: true, donations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get donation by ID
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('trustId', 'trustName');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.status(200).json({ success: true, donation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update donation
exports.updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.status(200).json({ success: true, donation });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete donation
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.status(200).json({ success: true, message: 'Donation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
