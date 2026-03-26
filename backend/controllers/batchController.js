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
      .populate('assignments')
      .populate('tests');
    
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

// @desc    Enroll student in batch (Handles both free and paid courses)
// @route   POST /api/batches/:id/enroll
// @access  Private (Student)
exports.enrollInBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('course');
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    // Check if already enrolled in this batch
    const existingBatchEnrollment = await BatchEnrollment.findOne({
      student: req.user.id,
      batch: req.params.id
    });

    if (existingBatchEnrollment) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this batch.' });
    }

    // Determine effective price
    const batchPrice = batch.batchPrice > 0 ? batch.batchPrice : (batch.course?.price || 0);
    
    // If course is NOT free and no Enrollment exists, block
    let courseEnrollment = await Enrollment.findOne({
        student: req.user.id,
        course: batch.course._id || batch.course
    });

    if (!courseEnrollment && batchPrice > 0) {
        return res.status(403).json({ success: false, message: 'Please complete payment to enroll.' });
    }

    // For FREE courses: auto-create Enrollment record if it doesn't exist
    if (!courseEnrollment) {
        courseEnrollment = await Enrollment.create({
            student: req.user.id,
            course: batch.course._id || batch.course,
            batch: batch._id,
            paymentStatus: 'free',
            paymentAmount: 0
        });

        // Update course student count
        await Course.findByIdAndUpdate(batch.course._id || batch.course, {
            $inc: { studentsEnrolled: 1 }
        });

        // Add to user's enrolled courses
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { enrolledCourses: batch.course._id || batch.course }
        });
    } else if (!courseEnrollment.batch) {
        // Existing enrollment without batch — assign this batch
        courseEnrollment.batch = batch._id;
        await courseEnrollment.save();
    }

    // Check if batch is full
    if (batch.currentEnrollment >= batch.maxStudents) {
      return res.status(400).json({ success: false, message: 'Batch is full' });
    }
    
    // Create BatchEnrollment (detailed tracking)
    const batchEnrollment = await BatchEnrollment.create({
      student: req.user.id,
      batch: req.params.id,
      course: batch.course._id || batch.course,
      paymentAmount: batchPrice,
      paymentStatus: batchPrice === 0 ? 'free' : 'paid'
    });
    
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
      .populate('student', 'name email profileImage phone')
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

// @desc    Add resource to batch
// @route   POST /api/batches/:id/resources
// @access  Private (Trainer only)
exports.addResourceToBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    batch.resources.push({
      ...req.body,
      createdAt: Date.now()
    });
    
    await batch.save();
    
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create announcement
// @route   POST /api/batches/:id/announcements
// @access  Private (Trainer only)
exports.createAnnouncement = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const Announcement = require('../models/Announcement');

    const announcement = await Announcement.create({
        title: req.body.title,
        message: req.body.message,
        batch: batch._id,
        trainer: req.user.id,
        attachments: req.body.attachments || []
    });
    
    batch.announcements.unshift(announcement._id);
    await batch.save();
    
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get real trainer dashboard stats (revenue, next sessions, batch-wise)
// @route   GET /api/batches/trainer/dashboard-stats
// @access  Private (Trainer/Admin)
exports.getTrainerDashboardStats = async (req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const LiveSession = require('../models/LiveSession');

    // 1. Get all batches by this trainer
    const batches = await Batch.find({ trainer: req.user.id })
      .populate('course', 'title thumbnail price');

    const batchIds = batches.map(b => b._id);

    // 2. Get all enrollments for these batches' courses
    const courseIds = [...new Set(batches.map(b => b.course?._id?.toString()).filter(Boolean))];
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      paymentStatus: { $in: ['paid', 'free'] }
    });

    // 3. Compute total revenue
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.paymentAmount || 0), 0);

    // 4. Compute batch-wise stats
    const batchEnrollments = await BatchEnrollment.find({ batch: { $in: batchIds } });
    
    // Group batch enrollments by batch
    const batchEnrollMap = {};
    batchEnrollments.forEach(be => {
      const bid = be.batch.toString();
      if (!batchEnrollMap[bid]) batchEnrollMap[bid] = [];
      batchEnrollMap[bid].push(be);
    });

    // 5. Get next upcoming session per batch
    const now = new Date();
    const upcomingSessions = await LiveSession.find({
      batch: { $in: batchIds },
      scheduledStartTime: { $gte: now }
    }).sort({ scheduledStartTime: 1 });

    const nextSessionMap = {};
    upcomingSessions.forEach(s => {
      const bid = s.batch.toString();
      if (!nextSessionMap[bid]) {
        nextSessionMap[bid] = s; // First one is the nearest
      }
    });

    // 6. Get total live sessions count per batch (for "Classes" stat)
    const allSessions = await LiveSession.find({ batch: { $in: batchIds } });
    const sessionCountMap = {};
    allSessions.forEach(s => {
      const bid = s.batch.toString();
      sessionCountMap[bid] = (sessionCountMap[bid] || 0) + 1;
    });

    // 7. Build batch-wise revenue (from course price * enrollments in that batch)
    const batchStats = batches.map(batch => {
      const bid = batch._id.toString();
      const batchStudents = batchEnrollMap[bid]?.length || batch.currentEnrollment || 0;
      const coursePrice = batch.course?.price || 0;
      const batchRevenue = coursePrice * batchStudents;
      const nextSession = nextSessionMap[bid] || null;
      const totalClasses = sessionCountMap[bid] || 0;

      return {
        batchId: bid,
        batchName: batch.name,
        courseName: batch.course?.title || 'Untitled',
        students: batchStudents,
        revenue: batchRevenue,
        totalClasses,
        nextSession: nextSession ? {
          title: nextSession.title,
          startTime: nextSession.scheduledStartTime
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalStudents: batchEnrollments.length,
        totalBatches: batches.length,
        totalCourses: courseIds.length,
        batchStats
      }
    });
  } catch (error) {
    console.error('getTrainerDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a student's details for a batch (test history, assignment submissions)
// @route   GET /api/batches/:id/students/:studentId/details
// @access  Private (Trainer/Admin)
exports.getStudentBatchDetails = async (req, res) => {
  try {
    const { id: batchId, studentId } = req.params;
    const TestSubmission = require('../models/TestSubmission');
    const AssignmentSubmission = require('../models/AssignmentSubmission');
    const Test = require('../models/Test');

    // 1. Get all tests for this batch
    const tests = await Test.find({ batch: batchId }).select('title startTime duration');

    // 2. Get this student's test submissions
    const testIds = tests.map(t => t._id);
    const testSubmissions = await TestSubmission.find({
      student: studentId,
      test: { $in: testIds }
    }).populate('test', 'title startTime duration');

    // 3. Build test results
    const testResults = tests.map(test => {
      const submission = testSubmissions.find(ts => ts.test?._id?.toString() === test._id.toString());
      return {
        testId: test._id,
        testTitle: test.title,
        testDate: test.startTime,
        attended: !!submission,
        totalScore: submission?.totalScore || 0,
        status: submission?.status || 'not_attempted',
        submittedAt: submission?.submittedAt || null
      };
    });

    // 4. Get assignment submissions for this batch
    const Assignment = require('../models/Assignment');
    const batchAssignments = await Assignment.find({ batch: batchId }).select('title dueDate maxMarks');
    const assignmentSubmissions = await AssignmentSubmission.find({
      student: studentId,
      batch: batchId
    }).populate('assignment', 'title dueDate maxMarks');

    const assignmentResults = batchAssignments.map(assignment => {
      const submission = assignmentSubmissions.find(as => 
        as.assignment?._id?.toString() === assignment._id.toString()
      );
      return {
        assignmentId: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        submitted: !!submission,
        marks: submission?.marks || null,
        status: submission?.status || 'not_submitted',
        submittedAt: submission?.submittedAt || null
      };
    });

    // 5. Get student info
    const student = await User.findById(studentId).select('name email profileImage phone');

    res.json({
      success: true,
      data: {
        student,
        testResults,
        assignmentResults
      }
    });
  } catch (error) {
    console.error('getStudentBatchDetails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};