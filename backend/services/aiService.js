const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of models to try in order of preference
const MODEL_CANDIDATES = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-pro",
  "gemini-pro-latest"
];

const getWorkingModel = async () => {
   // We will just use the first one for now, but in a real robust system we could test them.
   // For this user specifically, 2.0-flash gave 429 (limit 0).
   // 1.5-flash gave 404.
   // Let's default to a "smart" selection or just try-catch inside the generation.
   // Simplified approach: Create a helper that tries models.
   return genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); 
};

// Helper wrapper to try generation with fallbacks
const generateWithFallback = async (prompt) => {
    let lastError = null;
    for (const modelName of MODEL_CANDIDATES) {
        try {
            console.log(`🤖 AI Service: Trying model ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result;
        } catch (err) {
            console.warn(`⚠️ Model ${modelName} failed: ${err.message}`);
            lastError = err;
            // If it's a safety block or something specific, maybe stop? 
            // But for 404/429 we continue.
            if (err.message.includes('429') && modelName === 'gemini-2.0-flash') {
                 // specific known issue, continue immediately
            }
        }
    }
    throw lastError || new Error("All AI models failed.");
};

/**
 * Generates an interview question based on role and difficulty.
 * @param {string} role - The job role (e.g., "React Developer")
 * @param {string} difficulty - "Junior", "Mid", "Senior"
 * @returns {Promise<string>} - The generated question
 */
exports.generateQuestion = async (role, difficulty) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const prompt = `You are a strict technical interviewer. 
  Generate a single ${difficulty}-level interview question for a ${role} position.
  Only return the question text. Do not provide options or answers.`;

  const result = await generateWithFallback(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * Evaluates the user's answer and provides feedback + next question.
 * @param {string} role - Job Role
 * @param {string} question - The previous question asked
 * @param {string} userAnswer - The candidate's answer
 * @returns {Promise<object>} - { feedback, nextQuestion }
 */
exports.evaluateAndNext = async (role, question, userAnswer) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  const prompt = `
  Context: Technical Interview for ${role}.
  Question: "${question}"
  Candidate Answer: "${userAnswer}"

  Task:
  1. Evaluate the answer (Correct/Partial/Wrong). Provide a short, constructive feedback (max 2 sentences).
  2. Ask the next follow-up question.

  Output Format (JSON):
  {
    "feedback": "Your feedback here...",
    "nextQuestion": "Your next question here..."
  }
  return ONLY the JSON.`;

  const result = await generateWithFallback(prompt);
  const response = await result.response;
  let text = response.text();
  
  // Clean markdown if present
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
      return JSON.parse(text);
  } catch (e) {
      console.error("AI JSON Parse Error:", text);
      return {
          feedback: "Good attempt. Let's move on.",
          nextQuestion: "Tell me about your experience with Redux?"
      };
  }
};
