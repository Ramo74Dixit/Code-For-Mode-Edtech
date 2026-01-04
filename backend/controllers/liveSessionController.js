const LiveSession = require('../models/LiveSession');
const Batch = require('../models/Batch');

// @desc    Create a new live session
// @route   POST /api/live-sessions
// @access  Private (Trainer/Admin)
exports.createSession = async (req, res) => {
  try {
    const { title, description, batchId, youtubeUrl, startTime, endTime } = req.body;

    // Basic validation
    // Extract stream key or video ID if needed, for now just storing URL
    const session = await LiveSession.create({
      title,
      description,
      batch: batchId,
      trainer: req.user.id,
      youtubeLiveUrl: youtubeUrl,
      youtubeStreamKey: 'placeholder_key', // In real app, generate/fetch this
      scheduledStartTime: startTime,
      scheduledEndTime: endTime
    });

    // Add to batch
    await Batch.findByIdAndUpdate(batchId, {
      $push: { liveSessions: session._id }
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sessions for a batch
// @route   GET /api/batches/:batchId/live-sessions
// @access  Private (Enrolled/Trainer/Admin)
exports.getBatchSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ batch: req.params.batchId })
      .populate('trainer', 'name')
      .sort({ scheduledStartTime: 1 }); // Ascending order

    const now = new Date();
    
    // Categorize
    const upcoming = sessions.filter(s => new Date(s.scheduledEndTime) > now);
    const past = sessions.filter(s => new Date(s.scheduledEndTime) <= now);

    res.json({
      success: true,
      data: {
        upcoming,
        past
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
