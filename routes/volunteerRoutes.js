const express = require('express');
const { joinVolunteer, getVolunteers } = require('../controllers/volunteerController');

const router = express.Router();

router.post('/volunteer', joinVolunteer);
router.get('/volunteer', getVolunteers);

module.exports = router;