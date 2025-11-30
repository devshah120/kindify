const express = require('express');
const router = express.Router();
const multer = require('multer');
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

// POST /api/missing-persons - Create a new missing person report
router.post('/missing-persons', uploadMissingPersonImage, handleMulterError, missingPersonController.createMissingPerson);

// GET /api/missing-persons - Get all missing person reports
router.get('/missing-persons', missingPersonController.getMissingPersons);

module.exports = router;

