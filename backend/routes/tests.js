const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createTest, getTestsByBatch, getTestById, runCode, submitTest, getTestSubmissions } = require('../controllers/testController');

// Test Management
router.post('/', protect, authorize('trainer', 'admin'), createTest);
router.get('/batch/:batchId', protect, getTestsByBatch);
router.get('/:id', protect, getTestById);

// Execution & Submission
router.post('/run', protect, runCode);
router.post('/submit', protect, submitTest);
router.get('/:id/submissions', protect, authorize('trainer', 'admin'), getTestSubmissions);

module.exports = router;
