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

    // Add Test to Batch
    await Batch.findByIdAndUpdate(batchId, {
      $push: { tests: test._id }
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

        // Check if user has already submitted
        const submission = await TestSubmission.findOne({
            test: req.params.id,
            student: req.user.id
        });

        res.json({ 
            success: true, 
            data: {
                ...test.toObject(),
                submission // Will be null if not submitted
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTestSubmissions = async (req, res) => {
    try {
        const submissions = await TestSubmission.find({ test: req.params.id })
            .populate('student', 'name email')
            .sort('-totalScore');
            
        res.json({ success: true, data: submissions });
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

        const response = await axios.post('https://emkc.org/api/v2/piston/execute', payload, {
            timeout: 15000 // 15 second timeout
        });
        
        // Piston response structure: { run: { stdout: "...", stderr: "...", code: 0, ... } }
        const { run } = response.data;

        // Check if there's a compile error as well
        const compile = response.data.compile;
        if (compile && compile.stderr) {
            return res.json({
                success: true,
                data: {
                    output: '',
                    error: compile.stderr,
                    exitCode: compile.code
                }
            });
        }

        res.json({
            success: true,
            data: {
                output: run.stdout || '',
                error: run.stderr || '',
                exitCode: run.code
            }
        });

    } catch (error) {
        console.error("Piston Execution Error:", error.message);
        
        // More specific error messages
        let message = 'Failed to execute code';
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            message = 'Code execution timed out. Check for infinite loops.';
        } else if (error.response) {
            message = `Execution engine error (${error.response.status}): ${error.response.data?.message || 'Try again later'}`;
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            message = 'Code execution service is temporarily unavailable. Please try again in a moment.';
        }
        
        res.status(500).json({ success: false, message });
    }
};

exports.submitTest = async (req, res) => {
    try {
        const { testId, submissions } = req.body; // submissions: [{ questionId, code, language }]
        
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        let totalScore = 0;
        const results = [];

        // Iterate through each submitted question
        for (const sub of submissions) {
            const question = test.questions.id(sub.questionId);
            if (!question) continue;

            let passedCases = 0;
            const testCaseResults = [];

            // Run against ALL test cases (Hidden + Public)
            for (const tc of question.testCases) {
                try {
                    const runtime = PISTON_RUNTIMES[sub.language.toLowerCase()];
                    if (!runtime) throw new Error('Unsupported language');

                    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                        language: runtime.language,
                        version: runtime.version,
                        files: [{ content: sub.code }],
                        stdin: tc.input
                    });

                    const { run } = response.data;
                    const cleanOutput = run.stdout ? run.stdout.trim() : "";
                    const cleanExpected = tc.output.trim();
                    
                    const isMatch = cleanOutput === cleanExpected;
                    if (isMatch) passedCases++;

                    testCaseResults.push({
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        output: isMatch ? (tc.isHidden ? 'Hidden' : cleanOutput) : (tc.isHidden ? 'Hidden' : cleanOutput),
                        expected: tc.isHidden ? 'Hidden' : cleanExpected,
                        passed: isMatch,
                        isHidden: tc.isHidden
                    });

                } catch (err) {
                    console.error(`Error running test case for Q ${question.problemTitle}:`, err.message);
                    testCaseResults.push({
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        error: 'Execution Error',
                        passed: false,
                        isHidden: tc.isHidden
                    });
                }
            }

            // Calculate Score for this question
            // Points awarded = (Passed Cases / Total Cases) * Question Points
            const questionScore = Math.round((passedCases / question.testCases.length) * question.points);
            totalScore += questionScore;

            results.push({
                questionId: sub.questionId,
                code: sub.code,
                language: sub.language,
                passedCases,
                totalCases: question.testCases.length,
                score: questionScore,
                testCaseResults
            });
        }
        
        const submission = await TestSubmission.create({
            test: testId,
            student: req.user.id,
            sectionSubmissions: results,
            totalScore,
            status: 'submitted',
            submittedAt: new Date()
        });
        
        res.json({ 
            success: true, 
            message: 'Test submitted successfully', 
            data: submission 
        });

    } catch (error) {
        console.error("Submit Test Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Save pre-evaluated test results (from browser-based execution)
// @route   POST /api/tests/submit-evaluated
// @access  Private
exports.submitEvaluated = async (req, res) => {
    try {
        const { testId, sectionSubmissions, totalScore } = req.body;
        
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        // Check for duplicate submission
        const existing = await TestSubmission.findOne({
            test: testId,
            student: req.user.id
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already submitted this test.' });
        }

        const submission = await TestSubmission.create({
            test: testId,
            student: req.user.id,
            sectionSubmissions,
            totalScore,
            status: 'submitted',
            submittedAt: new Date()
        });
        
        res.json({ 
            success: true, 
            message: 'Test submitted successfully', 
            data: submission 
        });

    } catch (error) {
        console.error("Submit Evaluated Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
