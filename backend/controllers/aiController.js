const aiService = require('../services/aiService');

// @desc    Start simple interview session
// @route   POST /api/ai/interview/start
// @access  Private
exports.startInterview = async (req, res) => {
  try {
    const { role, difficulty } = req.body;
    
    // Generate first question
    const question = await aiService.generateQuestion(role, difficulty || 'Junior');
    
    res.json({
      success: true,
      data: {
        message: `Hello! I am your AI Interviewer. Let's start the ${difficulty} ${role} interview.`,
        question: question
      }
    });
  } catch (error) {
    console.error("AI Start Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process user message
// @route   POST /api/ai/interview/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    const { role, question, answer } = req.body;
    const data = await aiService.evaluateAndNext(role, question, answer);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.endInterview = async (req, res) => {
  try {
    const { role, history } = req.body;
    const report = await aiService.generateFeedbackReport(role, history.length, history);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Report Generation Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report." });
  }
};
