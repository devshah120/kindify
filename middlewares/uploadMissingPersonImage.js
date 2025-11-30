const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Create Cloudinary storage for missing person images
const storage = createCloudinaryStorage('kindify/missing-persons', ['jpg', 'jpeg', 'png', 'webp']);

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for missing person images'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file
  }
});

module.exports = upload.single('userImage');

