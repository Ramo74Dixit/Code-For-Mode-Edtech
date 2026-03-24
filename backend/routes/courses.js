const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addVideo,
  getTrainerCourses
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Debug log removed
router.get('/', getCourses);
router.get('/trainer/my-courses', protect, authorize('trainer', 'admin'), getTrainerCourses);
router.get('/:id', getCourse);
router.post('/', protect, authorize('trainer', 'admin'), createCourse);
router.put('/:id', protect, authorize('trainer', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('trainer', 'admin'), deleteCourse);
router.post('/:id/videos', protect, authorize('trainer', 'admin'), addVideo);

module.exports = router;