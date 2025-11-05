const multer = require('multer');
const { createCloudinaryStorage } = require('./cloudinary');

// Create Cloudinary storage for darpan certificates
const storage = createCloudinaryStorage('kindify/darpan-certificates', ['pdf', 'jpg', 'jpeg', 'png']);

// Only allow PDF, JPG, PNG
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed.'));
  }
};

module.exports = multer({ storage, fileFilter });
