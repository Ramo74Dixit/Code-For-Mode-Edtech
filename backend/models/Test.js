const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String, // e.g., "1 2"
    required: true
  },
  output: {
    type: String, // e.g., "3"
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false // Hidden test cases are for grading, visible ones are for examples
  }
});

const questionSchema = new mongoose.Schema({
  problemTitle: {
    type: String,
    required: true
  },
  problemDescription: {
    type: String, // Markdown supported
    required: true
  },
  // Difficulty for filtering/display
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  points: {
    type: Number,
    default: 10
  },
  // Test Cases for this question
  testCases: [testCaseSchema],
  
  // Default code stubs (optional)
  codeStubs: [{
      language: String, // e.g., "python", "javascript"
      code: String
  }]
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema], // Array of coding questions
  
  // Settings
  duration: {
    type: Number, // in minutes
    default: 60
  },
  startTime: Date,
  endTime: Date,
  
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', testSchema);
