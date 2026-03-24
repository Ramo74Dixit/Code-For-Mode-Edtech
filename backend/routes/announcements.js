const express = require('express');
const { getMyAnnouncements } = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMyAnnouncements);

module.exports = router;
