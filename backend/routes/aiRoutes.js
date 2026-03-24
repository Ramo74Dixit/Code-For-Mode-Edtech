const express = require('express');
const { startInterview, chatInterview } = require('../controllers/aiController');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/interview/start', aiController.startInterview);
router.post('/interview/chat', aiController.chat);
router.post('/interview/end', aiController.endInterview);

module.exports = router;
