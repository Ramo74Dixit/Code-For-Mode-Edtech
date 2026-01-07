const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getStats, getAllUsers, updateUserRole, deleteUser } = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin')); // Apply admin check to all routes

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
