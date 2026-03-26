const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createTest, updateTest, getTestsByBatch, getTestById, runCode, submitTest, getTestSubmissions, submitEvaluated } = require('../controllers/testController');

// Test Management
router.post('/', protect, authorize('trainer', 'admin'), createTest);
router.get('/batch/:batchId', protect, getTestsByBatch);
router.get('/:id', protect, getTestById);
router.put('/:id', protect, authorize('trainer', 'admin'), updateTest);

// Execution & Submission
router.post('/run', protect, runCode);
router.post('/submit', protect, submitTest);
router.post('/submit-evaluated', protect, submitEvaluated);
router.get('/:id/submissions', protect, authorize('trainer', 'admin'), getTestSubmissions);

module.exports = router;
