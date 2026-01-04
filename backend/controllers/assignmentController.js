const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Trainer/Admin)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, batchId, dueDate, totalMarks } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      batch: batchId,
      trainer: req.user.id,
      dueDate,
      maxMarks: totalMarks || 100
    });

    // Add to batch
    await Batch.findByIdAndUpdate(batchId, {
      $push: { assignments: assignment._id }
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get assignments for a batch
// @route   GET /api/batches/:batchId/assignments
// @access  Private (Enrolled/Trainer/Admin)
exports.getBatchAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ batch: req.params.batchId })
      .populate('trainer', 'name')
      .sort({ dueDate: 1 }); // Earliest due date first
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
  try {
    // Placeholder implementation
    res.status(200).json({ success: true, message: 'Submission logic pending' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Grade assignment
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Private (Trainer)
exports.gradeAssignment = async (req, res) => {
  try {
    // Placeholder implementation
    res.status(200).json({ success: true, message: 'Grading logic pending' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};