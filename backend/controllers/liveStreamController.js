const LiveSession = require('../models/LiveSession');
const Batch = require('../models/Batch');
const BatchEnrollment = require('../models/BatchEnrollment');

// @desc    Schedule live session
// @route   POST /api/live-sessions
// @access  Private (Trainer)
exports.scheduleLiveSession = async (req, res) => {
  try {
    if (!req.body) req.body = {};
    const batch = await Batch.findById(req.body.batch);
    
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    
    if (batch.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    req.body.trainer = req.user.id;
    const liveSession = await LiveSession.create(req.body);
    
    // Add to batch
    batch.liveSessions.push(liveSession._id);
    batch.totalClasses += 1;
    await batch.save();
    
    res.status(201).json({
      success: true,
      data: liveSession
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all live sessions for a batch
// @route   GET /api/live-sessions/batch/:batchId
// @access  Private
exports.getBatchLiveSessions = async (req, res) => {
  try {
    const liveSessions = await LiveSession.find({ batch: req.params.batchId })
      .populate('trainer', 'name email')
      .sort('-scheduledStartTime');
    
    res.json({
      success: true,
      count: liveSessions.length,
      data: liveSessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single live session
// @route   GET /api/live-sessions/:id
// @access  Private
exports.getLiveSession = async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id)
      .populate('batch')
      .populate('trainer', 'name email')
      .populate('attendees.student', 'name email');
    
    if (!liveSession) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }
    
    res.json({ success: true, data: liveSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start live session
// @route   PUT /api/live-sessions/:id/start
// @access  Private (Trainer)
exports.startLiveSession = async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }
    
    if (liveSession.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    liveSession.status = 'live';
    liveSession.actualStartTime = new Date();
    await liveSession.save();
    
    res.json({ success: true, data: liveSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End live session
// @route   PUT /api/live-sessions/:id/end
// @access  Private (Trainer)
exports.endLiveSession = async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }
    
    if (liveSession.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    liveSession.status = 'ended';
    liveSession.actualEndTime = new Date();
    
    // Save recording details if provided
    if (req.body.recordingUrl) {
      liveSession.recordingUrl = req.body.recordingUrl;
    }
    if (req.body.youtubeVideoId) {
      liveSession.youtubeVideoId = req.body.youtubeVideoId;
    }
    
    await liveSession.save();
    
    // Update batch completed classes
    const batch = await Batch.findById(liveSession.batch);
    batch.completedClasses += 1;
    await batch.save();
    
    res.json({ success: true, data: liveSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance for live session
// @route   POST /api/live-sessions/:id/attendance
// @access  Private (Student)
exports.markAttendance = async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }
    
    // Check if student is enrolled in batch
    const enrollment = await BatchEnrollment.findOne({
      student: req.user.id,
      batch: liveSession.batch
    });
    
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this batch' });
    }
    
    await liveSession.markAttendance(req.user.id);
    
    // Update student's attendance count
    enrollment.totalClassesAttended += 1;
    await enrollment.save();
    
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update live session
// @route   PUT /api/live-sessions/:id
// @access  Private (Trainer)
exports.updateLiveSession = async (req, res) => {
  try {
    let liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }
    
    if (liveSession.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    liveSession = await LiveSession.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({ success: true, data: liveSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete live session
// @route   DELETE /api/live-sessions/:id
// @access  Private (Trainer)
exports.deleteLiveSession = async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    
    if (!liveSession) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }
    
    if (liveSession.trainer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await liveSession.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming live sessions for student
// @route   GET /api/live-sessions/my/upcoming
// @access  Private (Student)
exports.getMyUpcomingLiveSessions = async (req, res) => {
  try {
    // Get student's enrolled batches
    const enrollments = await BatchEnrollment.find({ student: req.user.id });
    const batchIds = enrollments.map(e => e.batch);
    
    const liveSessions = await LiveSession.find({
      batch: { $in: batchIds },
      status: { $in: ['scheduled', 'live'] },
      scheduledStartTime: { $gte: new Date() }
    })
    .populate('batch', 'name')
    .populate('trainer', 'name')
    .sort('scheduledStartTime');
    
    res.json({
      success: true,
      count: liveSessions.length,
      data: liveSessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all live sessions for student (Upcoming & Past)
// @route   GET /api/live-sessions/my/all
// @access  Private (Student)
exports.getMyAllLiveSessions = async (req, res) => {
  try {
    const enrollments = await BatchEnrollment.find({ student: req.user.id });
    const batchIds = enrollments.map(e => e.batch);
    
    const allSessions = await LiveSession.find({
      batch: { $in: batchIds }
    })
    .populate('batch', 'name')
    .populate('trainer', 'name')
    .sort({ scheduledStartTime: 1 });
    
    // Convert to JSON to avoid mutation issues if any
    const sessions = allSessions.map(s => s.toObject());

    const now = new Date();
    
    // Logic: 
    // Upcoming: Scheduled end time is in the future
    // Past: Scheduled end time is in the past
    
    const upcoming = sessions.filter(s => new Date(s.scheduledEndTime) > now);
    const past = sessions.filter(s => new Date(s.scheduledEndTime) <= now).reverse(); // Most recent past first
    
    res.json({
      success: true,
      count: sessions.length,
      data: { upcoming, past }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};