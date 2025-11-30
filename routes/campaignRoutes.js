const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// POST /api/campaigns - Create a new campaign
router.post('/campaigns', campaignController.createCampaign);

// GET /api/campaigns - Get all campaigns
router.get('/campaigns', campaignController.getCampaigns);

module.exports = router;

