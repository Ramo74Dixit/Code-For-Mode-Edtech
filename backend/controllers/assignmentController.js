const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Trainer/Admin)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, batchId, dueDate, totalMarks } = req.body;
    console.log("DEBUG: createAssignment body:", req.body);
    console.log("DEBUG: User:", req.user.id);

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
    const { submissionLink, fileUrl } = req.body;
    const assignmentId = req.params.id;
    const studentId = req.user.id;

    // 1. Verify Assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // 2. Check overlap (Optional: prevent multiple submissions? Or allow overwrite?)
    // For now, allow overwrite or create new
    let submission = await AssignmentSubmission.findOne({
        assignment: assignmentId,
        student: studentId
    });

    if (submission) {
        // Update existing
        submission.submissionLink = submissionLink;
        submission.fileUrl = fileUrl;
        submission.submittedAt = Date.now();
        submission.status = 'submitted'; // Reset status if it was 'resubmit_requested'
        await submission.save();
    } else {
        // Create new
        submission = await AssignmentSubmission.create({
            assignment: assignmentId,
            student: studentId,
            batch: assignment.batch,
            submissionLink,
            fileUrl
        });
    }
    
    res.status(200).json({ 
        success: true, 
        data: submission,
        message: 'Assignment submitted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Trainer/Admin)
exports.getAssignmentSubmissions = async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
            .populate('student', 'name email profileImage')
            .sort('-submittedAt');
            
        res.json({
            success: true,
            count: submissions.length,
            data: submissions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Grade assignment submission
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Private (Trainer)
exports.gradeAssignment = async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    
    let submission = await AssignmentSubmission.findById(req.params.submissionId);
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = Date.now();
    
    await submission.save();

    res.status(200).json({ 
        success: true, 
        data: submission,
        message: 'Assignment graded successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};