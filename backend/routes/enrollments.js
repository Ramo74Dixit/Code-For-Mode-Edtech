const express = require('express');
const {
  getMyEnrollments,
  enrollCourse,
  updateProgress
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All enrollment routes needed protection

router.get('/', getMyEnrollments);
router.post('/:courseId', enrollCourse);
router.put('/:courseId/progress', updateProgress);

module.exports = router;