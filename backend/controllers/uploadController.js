const multer = require('multer');
const path = require('path');
const User = require('../models/User');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'avatar') {
      cb(null, 'uploads/avatars/');
    } else if (file.fieldname === 'resume') {
      cb(null, 'uploads/resumes/');
    } else {
      cb(new Error('Invalid field name'), false);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename: fieldname-userid-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'avatar') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  } else if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Not a PDF! Please upload a PDF resume.'), false);
    }
  } else {
    cb(new Error('Unknown field'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    
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

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;
    
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

exports.uploadMiddleware = upload;
