const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middlewares/auth');
const uploadMissingPersonImage = require('../middlewares/uploadMissingPersonImage');
const missingPersonController = require('../controllers/missingPersonController');

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 5MB allowed.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

// POST /api/missing-persons - Create a new missing person report (requires authentication)
router.post('/missing-persons', auth, uploadMissingPersonImage, handleMulterError, missingPersonController.createMissingPerson);

// GET /api/missing-persons - Get all missing person reports (requires authentication)
router.get('/missing-persons', auth, missingPersonController.getMissingPersons);

module.exports = router;

