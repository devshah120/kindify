// donationRoutes.js
const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/', donationController.createDonation);
router.get('/', donationController.getDonations);
router.get('/:id', donationController.getDonationById);
router.put('/:id', donationController.updateDonation);
router.delete('/:id', donationController.deleteDonation);

module.exports = router;
