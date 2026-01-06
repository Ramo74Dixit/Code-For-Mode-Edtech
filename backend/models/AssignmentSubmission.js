const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  
  // Submission Content
  submissionLink: String, // GitHub, Drive link etc.
  fileUrl: String,        // Uploaded file
  
  // Grading
  marks: {
    type: Number,
    default: null
  },
  feedback: String,
  status: {
    type: String,
    enum: ['submitted', 'graded', 'resubmit_requested'],
    default: 'submitted'
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
});

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
