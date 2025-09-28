const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../config/multer');
const auth = require('../middlewares/auth');
// router.post('/register', authController.register);            // body: { email, mobile, role }
// router.post('/verify-register', authController.verifyRegister);// body: { email, otp }
router.post('/login', authController.login);                  // body: { emailOrMobile }
router.post('/verify-login', authController.verifyLogin);     // body: { email, otp }
router.post('/trust/register', upload.single('darpanCertificate'), authController.registerTrust);
router.get('/trust/all',auth, authController.getAllTrusts);
module.exports = router;
