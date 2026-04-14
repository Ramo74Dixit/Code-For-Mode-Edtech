const express = require('express');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// ── Interview Coach ──
router.post('/interview/start', aiController.startInterview);
router.post('/interview/chat', aiController.chat);
router.post('/interview/end', aiController.endInterview);

// ── AI Tutor ──
router.post('/tutor/lesson-plan', aiController.getTutorLessonPlan);
router.post('/tutor/teach',       aiController.tutorTeachSection);
router.post('/tutor/followup',    aiController.tutorFollowup);
router.post('/tutor/quiz',        aiController.tutorGenerateQuiz);

module.exports = router;
