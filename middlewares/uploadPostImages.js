const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Create Cloudinary storage for posts
const storage = createCloudinaryStorage('kindify/posts', ['jpg', 'jpeg', 'png', 'webp']);

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|webp/;
  const extname = fileTypes.test(file.originalname.toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer instance with storage and file filter configuration (similar to story, but supports multiple files)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB size limit per file
    files: 10 // Maximum 10 files
  }
});

module.exports = upload;