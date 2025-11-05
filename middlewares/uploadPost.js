const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Create Cloudinary storage for posts
const storage = createCloudinaryStorage('kindify/posts', ['jpg', 'jpeg', 'png']);

// Allow only JPG & PNG for posts
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG & PNG allowed.'));
  }
};

module.exports = multer({ storage, fileFilter });
