const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/stories/';

    // Check if the directory exists
    if (!fs.existsSync(uploadDir)) {
      // If it doesn't exist, create the directory (recursive option ensures parent directories are created if needed)
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir); // Specify the upload destination
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as the filename to avoid duplicates
  }
});

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer instance with storage and file filter configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB size limit
});

module.exports = upload;
