const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Create Cloudinary storage for proof images (supports PDF and images)
const storage = createCloudinaryStorage('kindify/proof-images', ['jpg', 'jpeg', 'png', 'pdf']);

// Only allow PDF, JPG, PNG, JPEG
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, JPEG allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;

