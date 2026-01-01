const express = require('express');
const {
  createAssignment,
  getBatchAssignments,
  submitAssignment,
  gradeAssignment
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/batch/:batchId', protect, getBatchAssignments);
router.post('/', protect, authorize('trainer', 'admin'), createAssignment);
router.post('/:id/submit', protect, authorize('student'), submitAssignment);
router.put('/:id/grade/:submissionId', protect, authorize('trainer', 'admin'), gradeAssignment);

module.exports = router;