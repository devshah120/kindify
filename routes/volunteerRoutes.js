const express = require('express');
const { joinVolunteer } = require('../controllers/volunteerController');

const router = express.Router();

router.post('/volunteer', joinVolunteer);

module.exports = router;