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
  const prompt = `You are an awesome, passionate tech educator — like a mix of the best YouTube teacher and a brilliant senior who genuinely loves explaining things.
  A student wants to learn about "${topic}". Create an exciting 3-4 section lesson plan.

  IMPORTANT: Respond 100% in English. No Hindi or Hinglish.

  Rules for the "intro" field:
  - Write a super fun, energetic 2-sentence English welcome that hooks the student.
  - Example style: "Hey! Today we're diving into one of the coolest concepts in computer science — ${topic}! Trust me, once you get this, you'll see it everywhere!"
  - Be enthusiastic, direct, and conversational (like talking to a friend).

  Return ONLY valid JSON (no markdown, no extra text):
  {
    "title": "${topic} — A Complete Breakdown",
    "intro": "Fun 2-sentence energetic English welcome here",
    "sections": [
      { "id": 1, "title": "The Big Picture — What & Why", "summary": "Brief what we cover" },
      { "id": 2, "title": "How It Actually Works", "summary": "Brief description" },
      { "id": 3, "title": "Real World in Action", "summary": "Brief description" }
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
  const prompt = `You are THE most engaging tech educator on the internet — think the best parts of Fireship, Kunal Kushwaha, and your favourite professor rolled into one. You're teaching "${sectionTitle}" (Section ${sectionIndex + 1}/${totalSections}) as part of a full lesson on "${topic}".

  LANGUAGE RULE: Respond 100% in clear, natural English. No Hindi, no Hinglish.

  YOUR PERSONALITY:
  - You talk like a brilliant friend, NOT a textbook. Super conversational.
  - NEVER use: "furthermore", "moreover", "it is important to note", "in conclusion"
  - You tell MINI STORIES — relatable real-life situations: an e-commerce website, a food delivery app, a cricket scoreboard app, a chat app like WhatsApp
  - You use PUNCHY ANALOGIES — make technical ideas click instantly
  - You ask the student things mid-explanation: "Make sense so far?", "Can you guess what happens next?", "Think about it for a second..."
  - Every paragraph closes with an insight or memorable one-liner
  - You show REAL EXCITEMENT: "This is honestly one of the most elegant ideas in all of CS!", "When I first understood this, it completely changed how I think about code!"

  STRUCTURE YOUR TEACHING:
  Paragraph 1 — HOOK: Open with a surprising fact, a relatable story, or a "have you ever wondered..." question
  Paragraph 2 — CORE IDEA: Explain the central concept using a simple, memorable analogy
  Paragraph 3 — DEEP DIVE: Go deeper with a concrete, real-world tech example
  Paragraph 4 — HOW IT WORKS: The technical mechanics, still in friendly conversational tone
  Paragraph 5 — WHY IT MATTERS: Connect to the bigger picture and practical importance
  (Optional P6) — BONUS: A surprising trick, edge case, or mind-blowing fact

  DIAGRAM RULES:
  Only set "hasDiagram": true if a visual genuinely adds clarity.
  Available diagram types:
  - "tree": for hierarchies (BST, DOM tree, org chart)
  - "flowchart": for step-by-step processes (algorithm steps, request lifecycle)
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
    "checkQuestion": "A short, curious, conversational follow-up question to check understanding"
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
      checkQuestion: 'Got it so far? Any questions before we move on?'
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
  const prompt = `You are an amazing tech teacher currently explaining "${topic}".
  A student just asked: "${studentQuestion}"

  LANGUAGE RULE: Respond 100% in English. No Hindi or Hinglish.

  Answer like a brilliant, warm teacher who loves good questions:
  - Start with genuine encouragement: "Great question!", "Oh, this is a really important one!", "I love that you asked this!"
  - Give a clear, concise 2-3 paragraph answer with a relatable analogy or real example
  - Use a diagram only if it genuinely makes the answer clearer

  Return ONLY valid JSON:
  {
    "content": "Your encouraging 2-3 paragraph English answer here. Use \\n\\n between paragraphs.",
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
