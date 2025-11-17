const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const auth = require('../middlewares/auth');

// Support/Unsupport a user/trust (Follow/Unfollow) - Same as like/unlike, save/unsave
router.post('/support', auth, supportController.supportUser);
router.post('/unsupport', auth, supportController.unsupportUser);

// Get list of users/trusts the logged-in user is supporting (Following)
router.get('/supporting', auth, supportController.getSupporting);

// Get list of supporters for a specific user/trust (Followers)
router.get('/supporters/:trustId', auth, supportController.getSupporters);

// Get support stats for logged-in user (following & followers count)
router.get('/support/stats', auth, supportController.getSupportStats);

// Check if logged-in user is supporting a specific user/trust
router.get('/support/status/:trustId', auth, supportController.checkSupportStatus);

module.exports = router;

