const multer = require('multer');
const User = require('../models/User');
const { storage } = require('../config/cloudinary');

// Use Cloudinary Storage instead of Local DiskStorage
const upload = multer({ 
  storage: storage,
  // fileFilter logic is handled by Cloudinary params mostly, but we can keep size limits
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @desc    Upload Avatar
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const fileUrl = req.file.path; // Cloudinary returns the full URL in .path
    
    // Update user profile
    await User.findByIdAndUpdate(req.user.id, { profileImage: fileUrl });

    res.json({
      success: true,
      data: fileUrl,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload Resume
// @route   POST /api/upload/resume
// @access  Private
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const fileUrl = req.file.path;
    
    // Update user profile
    await User.findByIdAndUpdate(req.user.id, { resume: fileUrl });

    res.json({
      success: true,
      data: fileUrl,
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload Generic Resource
// @route   POST /api/upload/resource
// @access  Private
exports.uploadResource = async (req, res) => {
  try {
    console.log("DEBUG: Upload Resource Hit");
    console.log("DEBUG: Req File:", req.file);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const fileUrl = req.file.path;
    
    // Just return the URL, don't update any specific model as this is generic
    res.json({
      success: true,
      data: fileUrl,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadMiddleware = upload;
