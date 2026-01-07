const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true // Index for faster queries by room
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  attachments: [{
      type: { type: String, enum: ['image', 'video', 'file'], default: 'file' },
      url: { type: String, required: true },
      name: String
  }]
});

module.exports = mongoose.model('Message', messageSchema);
