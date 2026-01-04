const express = require('express');
const { register, login, getMe, updateDetails, getPublicProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.get('/:id/profile', getPublicProfile);

module.exports = router;