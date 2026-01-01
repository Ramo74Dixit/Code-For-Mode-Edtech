const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
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
  
  // YouTube Live Stream Details
  youtubeStreamKey: {
    type: String,
    required: true
  },
  youtubeLiveUrl: {
    type: String,
    required: true
  },
  youtubeVideoId: {
    type: String // After stream ends, this will have the video ID
  },
  
  // Schedule
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date,
    required: true
  },
  
  // Actual Times
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  
  // Stream Settings
  isUnlisted: {
    type: Boolean,
    default: true
  },
  isChatEnabled: {
    type: Boolean,
    default: true
  },
  isRecordingEnabled: {
    type: Boolean,
    default: true
  },
  
  // Attendance
  attendees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number, // in minutes
    isPresent: {
      type: Boolean,
      default: false
    }
  }],
  
  totalAttendees: {
    type: Number,
    default: 0
  },
  
  // Recording (after stream ends)
  recordingUrl: String,
  recordingDuration: Number,
  
  // Notes & Resources
  sessionNotes: String,
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'code', 'other']
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mark attendance
liveSessionSchema.methods.markAttendance = function(studentId) {
  const existing = this.attendees.find(a => a.student.toString() === studentId.toString());
  
  if (!existing) {
    this.attendees.push({
      student: studentId,
      joinedAt: new Date(),
      isPresent: true
    });
    this.totalAttendees = this.attendees.length;
  }
  
  return this.save();
};

// Calculate duration
liveSessionSchema.methods.calculateDuration = function() {
  if (this.actualStartTime && this.actualEndTime) {
    const duration = (this.actualEndTime - this.actualStartTime) / (1000 * 60); // in minutes
    return Math.round(duration);
  }
  return 0;
};

module.exports = mongoose.model('LiveSession', liveSessionSchema);