const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages } = require('../controllers/chatController');

router.get('/:room', protect, getMessages);

module.exports = router;
