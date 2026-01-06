const Test = require('../models/Test');
const TestSubmission = require('../models/TestSubmission');
const Batch = require('../models/Batch');
const axios = require('axios');

// Helper to map languages to Piston versions
const PISTON_RUNTIMES = {
    'javascript': { language: 'javascript', version: '18.15.0' },
    'python': { language: 'python', version: '3.10.0' },
    'cpp': { language: 'cpp', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' }
};

exports.createTest = async (req, res) => {
  try {
    const { title, description, batchId, questions, duration, startTime, endTime } = req.body;
    
    // Validate Batch
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    
    // Check trainer permissions (assuming middleware handles basic role check, but double check ownership if needed)
    // if (batch.trainer.toString() !== req.user.id) ... 

    const test = await Test.create({
      title,
      description,
      batch: batchId,
      creator: req.user.id,
      questions, // Array of objects matching schema
      duration,
      startTime,
      endTime
    });

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    console.error("Create Test Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestsByBatch = async (req, res) => {
  try {
    const tests = await Test.find({ batch: req.params.batchId })
        .sort({ createdAt: -1 });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
        res.json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Execute Code via Piston
exports.runCode = async (req, res) => {
    try {
        const { language, sourceCode, input } = req.body;
        
        const runtime = PISTON_RUNTIMES[language.toLowerCase()];
        if (!runtime) {
            return res.status(400).json({ success: false, message: 'Unsupported language' });
        }

        const payload = {
            language: runtime.language,
            version: runtime.version,
            files: [
                {
                    content: sourceCode
                }
            ],
            stdin: input || "",
        };

        const response = await axios.post('https://emkc.org/api/v2/piston/execute', payload);
        
        // Piston response structure: { run: { stdout: "...", stderr: "...", code: 0, ... } }
        const { run } = response.data;

        res.json({
            success: true,
            data: {
                output: run.stdout,
                error: run.stderr,
                exitCode: run.code
            }
        });

    } catch (error) {
        console.error("Piston Execution Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to execute code' });
    }
};

exports.submitTest = async (req, res) => {
    // Placeholder for full submission logic (Test Cases Validation)
    // For now, it will just save the submission state
    try {
        const { testId, submissions } = req.body; // submissions: [{ questionId, code, language }]
        
        // TODO: Serious logic to run code against HIDDEN test cases here
        // For MVP step 1, we just save the submission
        
        const submission = await TestSubmission.create({
            test: testId,
            student: req.user.id,
            sectionSubmissions: submissions, // simple map
            status: 'submitted',
            submittedAt: new Date()
        });
        
        res.json({ success: true, message: 'Test submitted successfully', data: submission });

    } catch (error) {
         res.status(500).json({ success: false, message: error.message });
    }
};
