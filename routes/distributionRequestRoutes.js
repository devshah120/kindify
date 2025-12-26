const express = require('express');
const router = express.Router();
const distributionRequestController = require('../controllers/distributionRequestController');
const uploadProofImage = require('../middlewares/uploadProofImage');

// Create a new distribution request (with file upload)
router.post(
  '/', 
  uploadProofImage.single('proofImage'), 
  distributionRequestController.createDistributionRequest
);

// Get all distribution requests (with optional filters)
router.get('/', distributionRequestController.getAllDistributionRequests);

// Get distribution request by ID
router.get('/:id', distributionRequestController.getDistributionRequestById);

// Get all distribution requests by a specific user
router.get('/user/:userId', distributionRequestController.getUserDistributionRequests);

// Update distribution request (status, remarks)
router.put('/:id', distributionRequestController.updateDistributionRequest);

// Delete distribution request
router.delete('/:id', distributionRequestController.deleteDistributionRequest);

module.exports = router;

