const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'edtech_platform', // The name of the folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto', // Allow raw files like PDFs
  },
});

module.exports = {
  cloudinary,
  storage
};
