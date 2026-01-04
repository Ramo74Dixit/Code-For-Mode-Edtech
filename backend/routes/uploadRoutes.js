const express = require('express');
const { uploadAvatar, uploadResume, uploadMiddleware } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/avatar', protect, uploadMiddleware.single('avatar'), uploadAvatar);
router.post('/resume', protect, uploadMiddleware.single('resume'), uploadResume);

module.exports = router;
