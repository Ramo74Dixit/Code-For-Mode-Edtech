const express = require('express');
const { getMyAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMyAnnouncements);
router.delete('/:id', authorize('trainer', 'admin'), deleteAnnouncement);

module.exports = router;
