const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Create Cloudinary storage for profile photos
const storage = createCloudinaryStorage('kindify/profile-photos', ['jpg', 'jpeg', 'png', 'webp']);

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for profile photos'), false);
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

module.exports = upload.single('profilePhoto');
