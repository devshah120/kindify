const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

// POST /api/emergencies - Create a new emergency
router.post('/emergencies', emergencyController.createEmergency);

// GET /api/emergencies - Get all emergencies
router.get('/emergencies', emergencyController.getEmergencies);

module.exports = router;

