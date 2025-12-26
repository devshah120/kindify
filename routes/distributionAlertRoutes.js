const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const distributionAlertController = require('../controllers/distributionAlertController');

// Create distribution alert (Trust/Admin only)
router.post('/distribution-alerts', auth, distributionAlertController.createDistributionAlert);

// Get all distribution alerts
router.get('/distribution-alerts', auth, distributionAlertController.getAllDistributionAlerts);

// Get distribution alert by ID
router.get('/distribution-alerts/:id', auth, distributionAlertController.getDistributionAlertById);

// Update distribution alert status
router.put('/distribution-alerts/:id/status', auth, distributionAlertController.updateDistributionAlertStatus);

// Delete distribution alert
router.delete('/distribution-alerts/:id', auth, distributionAlertController.deleteDistributionAlert);

module.exports = router;

