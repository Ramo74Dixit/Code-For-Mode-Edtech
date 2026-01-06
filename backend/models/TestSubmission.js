const mongoose = require('mongoose');

const questionSubmissionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String, // e.g., "python", "javascript"
    required: true
  },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Pending'],
    default: 'Pending'
  },
  passedCases: {
    type: Number,
    default: 0
  },
  totalCases: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  output: String, // Last run logic output or error message
  executionTime: Number // in ms
});

const testSubmissionSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  sectionSubmissions: [questionSubmissionSchema], // Results per question
  
  totalScore: {
    type: Number,
    default: 0
  },
  
  startedAt: Date,
  submittedAt: Date,
  
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'graded'],
    default: 'in_progress'
  }
});

module.exports = mongoose.model('TestSubmission', testSubmissionSchema);
