const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createSession, getBatchSessions } = require('../controllers/liveSessionController');
const { createAssignment, getBatchAssignments } = require('../controllers/assignmentController');

// Live Sessions
router.post('/live-sessions', protect, authorize('trainer', 'admin'), createSession);
router.get('/batches/:batchId/live-sessions', protect, getBatchSessions);

// Assignments
router.post('/assignments', protect, authorize('trainer', 'admin'), createAssignment);
router.get('/batches/:batchId/assignments', protect, getBatchAssignments);

module.exports = router;
