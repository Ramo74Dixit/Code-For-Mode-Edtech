const Message = require('../models/Message');

// @desc    Get messages for a specific room (batch)
// @route   GET /api/chat/:room
// @access  Private (Valid Token)
exports.getMessages = async (req, res) => {
  try {
    const { room } = req.params;
    
    // Fetch last 50 messages, sorted by time
    const messages = await Message.find({ room })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(50)
      .populate('sender', 'name profileImage'); // Populate sender details

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching messages'
    });
  }
};
