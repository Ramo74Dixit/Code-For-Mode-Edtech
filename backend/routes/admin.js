const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getStats } = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin')); // Apply admin check to all routes

router.get('/stats', getStats);

module.exports = router;
