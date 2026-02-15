const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/save-payment', paymentController.savePayment);
router.get('/trust/:trustId', paymentController.getPaymentsByTrust);

module.exports = router;
