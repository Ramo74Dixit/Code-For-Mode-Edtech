const express = require('express');
const {
  scheduleLiveSession,
  getBatchLiveSessions,
  getLiveSession,
  startLiveSession,
  endLiveSession,
  markAttendance,
  updateLiveSession,
  deleteLiveSession,
  getMyUpcomingLiveSessions,
  getMyAllLiveSessions
} = require('../controllers/liveStreamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/batch/:batchId', protect, getBatchLiveSessions);
router.get('/my/upcoming', protect, authorize('student'), getMyUpcomingLiveSessions);
router.get('/my/all', protect, authorize('student'), getMyAllLiveSessions);
router.get('/:id', protect, getLiveSession);

router.post('/', protect, authorize('trainer', 'admin'), scheduleLiveSession);
router.post('/:id/attendance', protect, authorize('student'), markAttendance);

router.put('/:id', protect, authorize('trainer', 'admin'), updateLiveSession);
router.put('/:id/start', protect, authorize('trainer', 'admin'), startLiveSession);
router.put('/:id/end', protect, authorize('trainer', 'admin'), endLiveSession);

router.delete('/:id', protect, authorize('trainer', 'admin'), deleteLiveSession);

module.exports = router;