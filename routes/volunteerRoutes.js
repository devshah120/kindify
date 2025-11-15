const express = require('express');
const { joinVolunteer, getVolunteers, getVolunteersByTrust, updateVolunteerStatus } = require('../controllers/volunteerController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/volunteer', joinVolunteer);
router.get('/volunteer', getVolunteers);

// Get volunteers by trust (for Trust admin) - with profile pics
router.get('/volunteer/trust/:trustId', auth, getVolunteersByTrust);

// Approve/Reject volunteer (Trust admin action)
router.post('/volunteer/:volunteerId/status', auth, updateVolunteerStatus);

module.exports = router;