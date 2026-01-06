const express = require('express');
const { uploadAvatar, uploadResume, uploadResource, uploadMiddleware } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/avatar', protect, uploadMiddleware.single('avatar'), uploadAvatar);
router.post('/resume', protect, uploadMiddleware.single('resume'), uploadResume);
router.post('/resource', protect, uploadMiddleware.single('resource'), uploadResource);

module.exports = router;
