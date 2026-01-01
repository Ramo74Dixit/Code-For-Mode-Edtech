const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Instructions
  instructions: String,
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  
  // Dates
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Settings
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 10 // percentage deduction
  },
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Submissions
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    files: [{
      name: String,
      url: String
    }],
    text: String,
    grade: Number,
    feedback: String,
    isLate: Boolean,
    gradedAt: Date,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  totalSubmissions: {
    type: Number,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'closed', 'graded'],
    default: 'active'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);