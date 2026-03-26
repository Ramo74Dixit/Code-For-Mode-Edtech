const express = require('express');
const {
  createBatch,
  getAllBatches,
  getBatch,
  updateBatch,
  deleteBatch,
  addVideoToBatch,
  removeVideoFromBatch,
  enrollInBatch,
  getMyBatches,
  getTrainerBatches,
  getBatchStudents,
  addResourceToBatch,
  createAnnouncement,
  getTrainerDashboardStats
} = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllBatches);
router.get('/my/enrollments', protect, getMyBatches);
router.get('/trainer/my-batches', protect, authorize('trainer', 'admin'), getTrainerBatches);
router.get('/trainer/dashboard-stats', protect, authorize('trainer', 'admin'), getTrainerDashboardStats);
router.get('/:id', getBatch);
router.get('/:id/students', protect, authorize('trainer', 'admin'), getBatchStudents);

router.post('/', protect, authorize('trainer', 'admin'), createBatch);
router.post('/:id/enroll', protect, authorize('student'), enrollInBatch);
router.post('/:id/videos', protect, authorize('trainer', 'admin'), addVideoToBatch);
router.post('/:id/resources', protect, authorize('trainer', 'admin'), addResourceToBatch);
router.post('/:id/announcements', protect, authorize('trainer', 'admin'), createAnnouncement);

router.put('/:id', protect, authorize('trainer', 'admin'), updateBatch);

router.delete('/:id', protect, authorize('trainer', 'admin'), deleteBatch);
router.delete('/:id/videos/:videoId', protect, authorize('trainer', 'admin'), removeVideoFromBatch);

module.exports = router;