const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const campaignController = require('../controllers/campaignController');

// POST /api/campaigns - Create a new campaign (requires authentication)
router.post('/campaigns', auth, campaignController.createCampaign);

// GET /api/campaigns - Get all campaigns (requires authentication)
router.get('/campaigns', auth, campaignController.getCampaigns);

// DELETE /api/campaigns/:id - Delete a campaign (requires authentication, only creator can delete)
router.delete('/campaigns/:id', auth, campaignController.deleteCampaign);

module.exports = router;

