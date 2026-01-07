const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
// const Payment = require('../models/Payment'); // Payment model not yet created, skipping revenue for now or using placeholder

// @desc    Get Admin Stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTrainers = await User.countDocuments({ role: 'trainer' });
    const totalCourses = await Course.countDocuments();
    const totalBatches = await Batch.countDocuments();
    
    // Recent signups
    const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt profileImage');

    res.json({
      success: true,
      data: {
        counts: {
            totalUsers,
            totalStudents,
            totalTrainers,
            totalCourses,
            totalBatches,
            totalRevenue: 0 // Placeholder until Payment system is live
        },
        recentUsers
      }
    });

  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
