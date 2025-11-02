const express = require('express');
const { submitContact, getContacts } = require('../controllers/contactController');

const router = express.Router();

router.post('/contact', submitContact);
router.get('/contact', getContacts);

module.exports = router;