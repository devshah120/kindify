const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to create Cloudinary storage for different upload types
function createCloudinaryStorage(folder, allowedFormats = ['jpg', 'jpeg', 'png']) {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: allowedFormats,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    }
  });
}

// Helper function to extract public_id from Cloudinary URL
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  try {
    // Extract public_id from URL like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    const parts = url.split('/upload/');
    if (parts.length > 1) {
      const afterUpload = parts[1].split('/');
      // Remove version number (first part after /upload/)
      const withoutVersion = afterUpload.slice(1).join('/');
      // Remove file extension
      return withoutVersion.split('.')[0];
    }
  } catch (error) {
    console.error('Error extracting public_id:', error);
  }
  
  return null;
}

// Helper function to delete image from Cloudinary
async function deleteFromCloudinary(publicIdOrUrl) {
  try {
    if (!publicIdOrUrl) return;
    
    // Extract public_id from URL if full URL is provided
    let imagePublicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      // If it's a URL, extract public_id using the helper function
      imagePublicId = extractPublicId(publicIdOrUrl);
      if (!imagePublicId) {
        console.error('Could not extract public_id from URL:', publicIdOrUrl);
        return null;
      }
    }
    
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return null;
  }
}

module.exports = {
  cloudinary,
  createCloudinaryStorage,
  deleteFromCloudinary,
  extractPublicId
};

