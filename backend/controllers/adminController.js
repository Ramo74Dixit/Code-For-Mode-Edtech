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
// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update User Role
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { role: req.body.role },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
