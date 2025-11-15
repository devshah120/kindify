const express = require('express');
const { submitContact, getContacts, getContactsByTrust } = require('../controllers/contactController');

const router = express.Router();

router.post('/contact', submitContact);
router.get('/contact', getContacts);
router.get('/contact/trust/:trustId', getContactsByTrust);

module.exports = router;