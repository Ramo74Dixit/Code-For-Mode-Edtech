const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
  video: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  watchedDuration: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
});

progressSchema.index({ student: 1, course: 1, video: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);