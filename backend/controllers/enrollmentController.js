const Enrollment = require('../models/Enrollment');
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

    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: req.params.courseId,
      paymentStatus: course.price === 0 ? 'free' : 'paid',
      paymentAmount: course.price
    });

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
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({ path: 'course', populate: { path: 'trainer', select: 'name email' } })
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

    const enrollment = await Enrollment.findOne({
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