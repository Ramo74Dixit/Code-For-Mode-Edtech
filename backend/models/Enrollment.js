const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'paid', 'pending'],
    default: 'free'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedVideos: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  lastAccessedVideo: {
    type: mongoose.Schema.Types.ObjectId
  },
  completedAt: {
    type: Date
  }
});

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);