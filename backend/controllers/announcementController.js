const Announcement = require('../models/Announcement');
const BatchEnrollment = require('../models/BatchEnrollment');
const Batch = require('../models/Batch');

// @desc    Get all announcements for logged in user (student/trainer)
// @route   GET /api/announcements
// @access  Private
exports.getMyAnnouncements = async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.user.role === 'student') {
        // 1. Find batches student is enrolled in
        const enrollments = await BatchEnrollment.find({ student: req.user.id }).select('batch');
        const batchIds = enrollments.map(e => e.batch);

        // 2. Find announcements for those batches
        query.batch = { $in: batchIds };
    } else if (req.user.role === 'trainer') {
        // Trainers see announcements they created OR for their batches
        // Simplest: Announcements they created
        query.trainer = req.user.id;
    } else if (req.user.role === 'admin') {
        // Admin sees all? Or just return all for now
    }

    const announcements = await Announcement.find(query)
      .populate('batch', 'name')
      .populate('trainer', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
