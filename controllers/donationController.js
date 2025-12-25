// donationController.js
const Donation = require('../models/Donation');
const User = require('../models/User');
const { sendNotificationToRole, sendNotificationToUser } = require('../services/notificationService');

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
    
    // Populate trust info for notification
    await donation.populate('trustId', 'trustName');
    
    // Send notification to all users about new donation opportunity
    if (donation.trustId && donation.trustId.trustName) {
      try {
        await sendNotificationToRole(
          'User', // Only send to users with role "User", not "Trust"
          'New Donation Opportunity! 💝',
          `${donation.trustId.trustName} has a new donation opportunity`,
          {
            type: 'new_donation',
            donationId: donation._id.toString(),
            trustName: donation.trustId.trustName,
            trustId: trustId
          }
        );
        console.log(`✅ Notification sent to all users about new donation: ${donation._id}`);
      } catch (notificationError) {
        console.error('❌ Error sending donation notification:', notificationError);
      }
    }
    
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
