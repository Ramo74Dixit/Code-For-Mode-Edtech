const BatchEnrollment = require('../models/BatchEnrollment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Enroll in course
// @route   POST /api/enrollments/:courseId
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingEnrollment = await BatchEnrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    // For manual free enrollment, we need a batch
    const Batch = require('../models/Batch');
    let batch = await Batch.findOne({ course: req.params.courseId }).sort('-createdAt');
    if (!batch) {
        batch = await Batch.create({
            title: `${course.title} - Self Paced`,
            course: req.params.courseId,
            trainer: course.trainer,
            startDate: new Date(),
            students: []
        });
    }

    const enrollment = await BatchEnrollment.create({
      student: req.user.id,
      batch: batch._id,
      course: req.params.courseId,
      enrollmentStatus: 'active',
      paymentStatus: course.price === 0 ? 'free' : 'paid',
      paymentAmount: course.price
    });
    
    // Add student to batch
    batch.enrolledStudents.push(req.user.id);
    await batch.save();

    course.studentsEnrolled += 1;
    await course.save();

    await User.findByIdAndUpdate(req.user.id, { $push: { enrolledCourses: req.params.courseId } });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my enrollments
// @route   GET /api/enrollments
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await BatchEnrollment.find({ student: req.user.id })
      .populate({ path: 'course', populate: { path: 'trainer', select: 'name email' } })
      .populate({
        path: 'batch',
        select: 'name startDate status enrolledStudents',
        populate: { path: 'enrolledStudents', select: '_id' } // Just count needed usually, or IDs
      })
      .sort('-enrolledAt');

    res.json({ success: true, count: enrollments.length, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update progress
// @route   PUT /api/enrollments/:courseId/progress
exports.updateProgress = async (req, res) => {
  try {
    const { videoId, isCompleted } = req.body;

    const enrollment = await BatchEnrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    if (isCompleted && !enrollment.completedVideos.includes(videoId)) {
      enrollment.completedVideos.push(videoId);
      enrollment.lastAccessedVideo = videoId;

      const course = await Course.findById(req.params.courseId);
      const totalVideos = course.videos.length;
      const completedCount = enrollment.completedVideos.length;
      enrollment.progress = Math.round((completedCount / totalVideos) * 100);

      if (enrollment.progress === 100 && !enrollment.completedAt) {
        enrollment.completedAt = Date.now();
      }

      await enrollment.save();
    }

    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};