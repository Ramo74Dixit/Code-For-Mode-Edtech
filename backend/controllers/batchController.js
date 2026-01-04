const Batch = require('../models/Batch');
const BatchEnrollment = require('../models/BatchEnrollment');
const Course = require('../models/Course');
const User = require('../models/User');
// Ensure these models are registered for populating
require('../models/Announcement');
require('../models/LiveSession');
require('../models/Assignment');

// @desc    Create new batch
// @route   POST /api/batches
// @access  Private (Trainer only)
exports.createBatch = async (req, res) => {
  try {
    if (!req.body) req.body = {};
    req.body.trainer = req.user.id;
    
    // Check if course belongs to trainer
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const batch = await Batch.create(req.body);
    
    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public
exports.getAllBatches = async (req, res) => {
  try {
    const { course, status, trainer } = req.query;
    let query = { isActive: true };
    
    if (course) query.course = course;
    if (status) query.status = status;
    if (trainer) query.trainer = trainer;
    
    const batches = await Batch.find(query)
      .populate('course', 'title thumbnail')
      .populate('trainer', 'name email')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Public
exports.getBatch = async (req, res) => {
  try {
    console.log("DEBUG: getBatch called with ID:", req.params.id);
    const batch = await Batch.findById(req.params.id)
      .populate('course')
      .populate('trainer', 'name email bio')
      .populate('enrolledStudents', 'name email')
      .populate('liveSessions')
      .populate('announcements')
      .populate('assignments');
    
    console.log("DEBUG: Batch found:", batch ? batch._id : "NULL");

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Private (Trainer only)
exports.updateBatch = async (req, res) => {
  try {
    let batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    batch = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private (Trainer only)
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await batch.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add video to batch
// @route   POST /api/batches/:id/videos
// @access  Private (Trainer only)
exports.addVideoToBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    batch.videos.push({
      ...req.body,
      order: batch.videos.length + 1
    });
    
    await batch.save();
    
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove video from batch
// @route   DELETE /api/batches/:id/videos/:videoId
// @access  Private (Trainer only)
exports.removeVideoFromBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    batch.videos = batch.videos.filter(v => v._id.toString() !== req.params.videoId);
    await batch.save();
    
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Enrollment = require('../models/Enrollment');

// ... (existing imports)

// @desc    Enroll student in batch (After Course Enrollment)
// @route   POST /api/batches/:id/enroll
// @access  Private (Student)
exports.enrollInBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    // 1. Verify Course Enrollment (Payment)
    const courseEnrollment = await Enrollment.findOne({
        student: req.user.id,
        course: batch.course
    });

    if (!courseEnrollment) {
        return res.status(403).json({ success: false, message: 'Please enroll in the course first.' });
    }

    // 2. Check if already joined ANY batch for this course
    if (courseEnrollment.batch) {
         // Optional: Allow switching batches? For now strict 1 batch rule as requested.
         return res.status(400).json({ success: false, message: 'You have already joined a batch for this course.' });
    }

    // Check if batch is full
    if (batch.currentEnrollment >= batch.maxStudents) {
      return res.status(400).json({ success: false, message: 'Batch is full' });
    }
    
    // Create BatchEnrollment (Detailed tracking)
    const batchEnrollment = await BatchEnrollment.create({
      student: req.user.id,
      batch: req.params.id,
      course: batch.course,
      paymentAmount: 0, // Paid via Course Enrollment
      paymentStatus: 'paid'
    });
    
    // Update Main Enrollment with Batch ID
    courseEnrollment.batch = batch._id;
    await courseEnrollment.save();

    // Update Batch
    batch.enrolledStudents.push(req.user.id);
    await batch.updateEnrollmentCount();
    
    res.status(201).json({
      success: true,
      data: batchEnrollment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my batches (Student)
// @route   GET /api/batches/my/enrollments
// @access  Private (Student)
exports.getMyBatches = async (req, res) => {
  try {
    const enrollments = await BatchEnrollment.find({ student: req.user.id })
      .populate({
        path: 'batch',
        populate: [
          { path: 'course', select: 'title thumbnail' },
          { path: 'trainer', select: 'name email' }
        ]
      })
      .sort('-enrolledAt');
    
    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trainer's batches
// @route   GET /api/batches/trainer/my-batches
// @access  Private (Trainer)
exports.getTrainerBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ trainer: req.user.id })
      .populate('course', 'title')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get batch students
// @route   GET /api/batches/:id/students
// @access  Private (Trainer)
exports.getBatchStudents = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const enrollments = await BatchEnrollment.find({ batch: req.params.id })
      .populate('student', 'name email')
      .sort('-enrolledAt');
    
    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};