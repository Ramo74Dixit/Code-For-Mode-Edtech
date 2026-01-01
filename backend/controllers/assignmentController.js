const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const BatchEnrollment = require('../models/BatchEnrollment');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private (Trainer)
exports.createAssignment = async (req, res) => {
  try {
    if (!req.body) req.body = {};
    const batch = await Batch.findById(req.body.batch);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    req.body.trainer = req.user.id;
    const assignment = await Assignment.create(req.body);
    
    // Add to batch
    batch.assignments.push(assignment._id);
    await batch.save();
    
    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get batch assignments
// @route   GET /api/assignments/batch/:batchId
// @access  Private
exports.getBatchAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ batch: req.params.batchId })
      .populate('trainer', 'name email')
      .sort('-assignedDate');
    
    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    // Check if student is enrolled
    const enrollment = await BatchEnrollment.findOne({
      student: req.user.id,
      batch: assignment.batch
    });
    
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
    }
    
    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      s => s.student.toString() === req.user.id.toString()
    );
    
    if (existingSubmission) {
      return res.status(400).json({ success: false, message: 'Already submitted' });
    }
    
    const isLate = new Date() > assignment.dueDate;
    
    assignment.submissions.push({
      student: req.user.id,
      submittedAt: new Date(),
      files: req.body.files || [],
      text: req.body.text || '',
      isLate
    });
    
    assignment.totalSubmissions += 1;
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Grade assignment
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Private (Trainer)
exports.gradeAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    if (assignment.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const submission = assignment.submissions.id(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;
    
    await assignment.save();
    
    // Update student's batch enrollment
    const enrollment = await BatchEnrollment.findOne({
      student: submission.student,
      batch: assignment.batch
    });
    
    if (enrollment) {
      enrollment.submittedAssignments.push({
        assignmentId: assignment._id,
        submittedAt: submission.submittedAt,
        grade: submission.grade,
        feedback: submission.feedback
      });
      await enrollment.save();
    }
    
    res.json({
      success: true,
      message: 'Assignment graded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};