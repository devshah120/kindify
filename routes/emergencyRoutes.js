const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const emergencyController = require('../controllers/emergencyController');

// POST /api/emergencies - Create a new emergency (requires authentication)
router.post('/emergencies', auth, emergencyController.createEmergency);

// GET /api/emergencies - Get all emergencies (requires authentication)
router.get('/emergencies', auth, emergencyController.getEmergencies);

module.exports = router;

