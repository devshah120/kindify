const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');

// Create Cloudinary storage for posts
const storage = createCloudinaryStorage('kindify/posts', ['jpg', 'jpeg', 'png', 'webp']);

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(file.originalname.toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only images allowed'));
};

// no fixed file count; you can set limits.files if desired
module.exports = multer({ storage, fileFilter /*, limits: { files: 50 } */ });