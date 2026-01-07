const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add batch name'],
    trim: true,
    maxlength: [100, 'Batch name cannot exceed 100 characters']
  },
  batchCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Batch Schedule
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Timing
  classSchedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String, // "18:00"
    endTime: String,   // "20:00"
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  }],
  
  // Capacity
  maxStudents: {
    type: Number,
    required: true,
    default: 50
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  currentEnrollment: {
    type: Number,
    default: 0
  },
  
  // Batch Content
  videos: [{
    title: String,
    youtubeId: String,
    duration: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isUnlisted: {
      type: Boolean,
      default: true
    },
    order: Number
  }],
  
  liveSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession'
  }],
  announcements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement'
  }],
  
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  }],
  
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'image', 'link', 'video', 'other'],
      default: 'other'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  
  enrollmentType: {
    type: String,
    enum: ['open', 'invite-only', 'closed'],
    default: 'open'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  batchPrice: {
    type: Number,
    default: 0
  },
  
  totalClasses: {
    type: Number,
    default: 0
  },
  completedClasses: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

batchSchema.pre('save', async function() {
  if (!this.batchCode) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.batchCode = `BATCH-${timestamp}-${random}`;
  }
  this.updatedAt = Date.now();
});

batchSchema.methods.updateEnrollmentCount = function() {
  this.currentEnrollment = this.enrolledStudents.length;
  return this.save();
};

module.exports = mongoose.model('Batch', batchSchema);