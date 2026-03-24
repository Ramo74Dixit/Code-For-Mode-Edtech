const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const modelResponse = await genAI.getModel("models/gemini-1.5-flash");
    console.log("Model Info:", modelResponse);
  } catch (e) {
    console.log("Direct access failed, listing all...");
  }

  // Not all SDK versions expose listModels cleanly in valid JS execution without checking types, 
  // but let's try assuming the user has a valid key. 
  // actually, the error message suggested Call ListModels.
  // In the node SDK, normally we don't list models via the client instance easily in some versions.
  // Let's try a simple generation with a very basic model name "gemini-1.0-pro" which is often thefallback.
}

async function testConfig() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" }); 
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-flash-001");
    } catch (e) {
        console.error("Failed 1.5-flash-001:", e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); 
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.0-pro");
    } catch (e) {
        console.error("Failed 1.0-pro:", e.message);
    }
}

testConfig();
