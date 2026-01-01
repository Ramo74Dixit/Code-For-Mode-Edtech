const mongoose = require('mongoose');

const batchEnrollmentSchema = new mongoose.Schema({
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
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Enrollment Details
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  enrollmentStatus: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended'],
    default: 'active'
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['free', 'paid', 'pending', 'partial'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  transactionId: String,
  
  // Progress Tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Attendance
  totalClassesAttended: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  
  // Video Progress
  watchedVideos: [{
    videoId: mongoose.Schema.Types.ObjectId,
    watchedAt: Date,
    watchedPercentage: Number
  }],
  
  // Assignments
  submittedAssignments: [{
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    submittedAt: Date,
    grade: Number,
    feedback: String
  }],
  
  // Performance
  overallGrade: {
    type: Number,
    default: 0
  },
  rank: Number,
  
  // Certificate
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: String,
  certificateIssuedAt: Date,
  
  // Notes
  studentNotes: String,
  trainerNotes: String,
  
  completedAt: Date
});

// Compound index
batchEnrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });

// Calculate attendance percentage
batchEnrollmentSchema.methods.updateAttendance = function(totalClasses) {
  if (totalClasses > 0) {
    this.attendancePercentage = Math.round((this.totalClassesAttended / totalClasses) * 100);
  }
  return this.save();
};

module.exports = mongoose.model('BatchEnrollment', batchEnrollmentSchema);