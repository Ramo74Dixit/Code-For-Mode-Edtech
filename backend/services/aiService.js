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

// ─────────────────────────────────────────────────────────────
// AI TUTOR FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Generates a structured lesson plan for a topic.
 * @param {string} topic - The topic to teach
 * @returns {Promise<object>} - { title, intro, sections[] }
 */
exports.generateLessonPlan = async (topic) => {
  const prompt = `You are an expert Indian teacher. A student wants to learn about: "${topic}".

  Create a structured lesson plan with exactly 3-4 sections.

  Return ONLY valid JSON (no markdown, no extra text):
  {
    "title": "Learning: ${topic}",
    "intro": "A warm 1-sentence welcome in a friendly Indian teacher tone",
    "sections": [
      { "id": 1, "title": "Introduction & Basics", "summary": "Brief description of what this section covers" },
      { "id": 2, "title": "Core Concepts", "summary": "Brief description" },
      { "id": 3, "title": "Practical Examples", "summary": "Brief description" }
    ]
  }`;

  const result = await generateWithFallback(prompt);
  const response = await result.response;
  let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Lesson Plan Parse Error:', text);
    return {
      title: `Learning: ${topic}`,
      intro: `Aaj hum ${topic} seekhenge. Chaliye shuru karte hain!`,
      sections: [
        { id: 1, title: 'Introduction & Basics', summary: 'Foundation of the topic' },
        { id: 2, title: 'Core Concepts', summary: 'Deep dive into main ideas' },
        { id: 3, title: 'Practical Examples', summary: 'Real-world application' }
      ]
    };
  }
};

/**
 * Teaches one section of the lesson in Indian teacher style.
 * @param {string} topic - Main topic
 * @param {string} sectionTitle - Current section title
 * @param {number} sectionIndex - 0-based index
 * @param {number} totalSections - Total number of sections
 * @returns {Promise<object>} Teaching content with optional diagram
 */
exports.teachSection = async (topic, sectionTitle, sectionIndex, totalSections) => {
  const prompt = `You are a warm, enthusiastic Indian classroom teacher teaching "${sectionTitle}" as part of a lesson on "${topic}" (Section ${sectionIndex + 1} of ${totalSections}).

  TEACHING GUIDELINES:
  - Speak like a real Indian teacher: use phrases like "dekho", "samjho", "yaad rakhna", "very good", "bilkul theek", etc.
  - Give a thorough, detailed explanation (4-6 paragraphs) with real-world examples.
  - Use simple analogies that Indian students relate to.
  - Be encouraging and conversational.

  DIAGRAM RULES:
  Only set "hasDiagram": true if a visual genuinely helps understanding.
  Available diagram types:
  - "tree": for hierarchies (BST, DOM, org chart)
  - "flowchart": for step-by-step processes (algorithm, request lifecycle)
  - "table": for comparisons (time complexity, feature comparison)
  - "code": for code examples
  - "list": for key points / summary bullets

  Return ONLY valid JSON:
  {
    "content": "Your detailed 4-6 paragraph teaching here. Use \\n\\n between paragraphs.",
    "hasDiagram": false,
    "diagramType": null,
    "diagramTitle": null,
    "diagramData": null,
    "checkQuestion": "A casual follow-up check question in Indian teacher style"
  }

  If hasDiagram is true:
  - For "table":    diagramData = { "headers": ["Col1","Col2"], "rows": [["val","val"]] }
  - For "flowchart": diagramData = { "steps": [{"label":"Step 1","desc":"Description"}] }
  - For "tree":     diagramData = { "label": "Root", "children": [{"label":"Child","children":[]}] }
  - For "code":     diagramData = { "language": "javascript", "code": "// code here" }
  - For "list":     diagramData = { "title": "Key Points", "items": ["Point 1", "Point 2"] }`;

  const result = await generateWithFallback(prompt);
  const response = await result.response;
  let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('TeachSection Parse Error:', text);
    return {
      content: text,
      hasDiagram: false,
      diagramType: null,
      diagramTitle: null,
      diagramData: null,
      checkQuestion: 'Kya aapko samajh aaya? Koi sawaal hai?'
    };
  }
};

/**
 * Answers a follow-up question from the student during a lesson.
 * @param {string} topic - Main topic
 * @param {string} studentQuestion - The student's question
 * @returns {Promise<object>} Answer with optional diagram
 */
exports.answerFollowup = async (topic, studentQuestion) => {
  const prompt = `You are a warm Indian teacher currently teaching "${topic}".
  A student has asked: "${studentQuestion}"

  Answer clearly and warmly, like a real teacher would.
  - Start with an encouraging phrase like "Bahut achha sawaal hai!" or "Bilkul sahi socha!"
  - Give a clear 2-3 paragraph answer with relatable examples.
  - Suggest a diagram only if it genuinely helps understanding.

  Return ONLY valid JSON:
  {
    "content": "Your encouraging 2-3 paragraph answer here. Use \\n\\n between paragraphs.",
    "hasDiagram": false,
    "diagramType": null,
    "diagramTitle": null,
    "diagramData": null
  }

  Same diagramData format rules as before if hasDiagram is true.`;

  const result = await generateWithFallback(prompt);
  const response = await result.response;
  let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { content: text, hasDiagram: false, diagramType: null, diagramTitle: null, diagramData: null };
  }
};

/**
 * Generates a mini quiz of 3 MCQ questions for the completed lesson.
 * @param {string} topic - The topic taught
 * @param {string[]} sectionTitles - List of section titles covered
 * @returns {Promise<object>} - { questions: [{id, question, options, correct, explanation}] }
 */
exports.generateQuiz = async (topic, sectionTitles) => {
  const prompt = `You are an Indian teacher. Create exactly 3 multiple choice questions to test understanding of "${topic}".
  Sections covered: ${sectionTitles.join(', ')}.

  Make them: 1 easy, 1 medium, 1 slightly tricky.

  Return ONLY valid JSON:
  {
    "questions": [
      {
        "id": 1,
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 0,
        "explanation": "Brief, friendly explanation of why this is the correct answer."
      }
    ]
  }
  "correct" is the 0-based index of the correct option.`;

  const result = await generateWithFallback(prompt);
  const response = await result.response;
  let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Quiz Parse Error:', text);
    return {
      questions: [
        {
          id: 1,
          question: `What is the core idea behind "${topic}"?`,
          options: ['It organizes data efficiently', 'It handles network requests', 'It styles UI components', 'It manages state'],
          correct: 0,
          explanation: 'This is the fundamental principle of this topic.'
        }
      ]
    };
  }
};
