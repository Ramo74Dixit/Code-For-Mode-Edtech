const Test = require('../models/Test');
const TestSubmission = require('../models/TestSubmission');
const Batch = require('../models/Batch');
const axios = require('axios');

// Judge0 CE language IDs
const JUDGE0_LANG_IDS = {
    'javascript': 63,  // Node.js
    'python': 71,      // Python 3
    'java': 62,        // Java (OpenJDK)
    'cpp': 54          // C++ (GCC)
};

// Execute code using Judge0 CE (free, no auth required)
const executeCode = async (language, sourceCode, input) => {
    const langId = JUDGE0_LANG_IDS[language.toLowerCase()];
    if (!langId) throw new Error('Unsupported language');

    try {
        const response = await axios.post(
            'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
            {
                language_id: langId,
                source_code: sourceCode,
                stdin: input || ""
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            }
        );

        const data = response.data;

        // Check for compile error
        if (data.compile_output && data.status?.id !== 3) {
            return { output: '', error: data.compile_output };
        }

        // Check for runtime error
        if (data.stderr) {
            return { output: data.stdout || '', error: data.stderr };
        }

        // Status 3 = Accepted, 5 = Time Limit Exceeded, 6 = Compilation Error, etc.
        if (data.status?.id === 5) {
            return { output: '', error: 'Time Limit Exceeded. Check for infinite loops.' };
        }

        if (data.status?.id === 6) {
            return { output: '', error: data.compile_output || 'Compilation Error' };
        }

        return {
            output: data.stdout || '',
            error: ''
        };

    } catch (error) {
        console.error('Judge0 CE Error:', error.message);
        throw new Error('Code execution service is temporarily unavailable. Please try again.');
    }
};

// ─── CRUD Operations ─────────────────────────────

exports.createTest = async (req, res) => {
  try {
    const { title, description, batchId, questions, duration, startTime, endTime } = req.body;
    
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const test = await Test.create({
      title,
      description,
      batch: batchId,
      creator: req.user.id,
      questions,
      duration,
      startTime,
      endTime
    });

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

        const submission = await TestSubmission.findOne({
            test: req.params.id,
            student: req.user.id
        });

        res.json({ 
            success: true, 
            data: {
                ...test.toObject(),
                submission
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

// ─── Code Execution ─────────────────────────────

exports.runCode = async (req, res) => {
    try {
        const { language, sourceCode, input } = req.body;
        
        if (!JUDGE0_LANG_IDS[language.toLowerCase()]) {
            return res.status(400).json({ success: false, message: 'Unsupported language' });
        }

        const result = await executeCode(language, sourceCode, input);

        res.json({
            success: true,
            data: {
                output: result.output,
                error: result.error,
                exitCode: result.error ? 1 : 0
            }
        });

    } catch (error) {
        console.error("Code Execution Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Test Submission (backend evaluates via Judge0) ─────────

exports.submitTest = async (req, res) => {
    try {
        const { testId, submissions } = req.body;
        
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        let totalScore = 0;
        const results = [];

        for (const sub of submissions) {
            const question = test.questions.id(sub.questionId);
            if (!question) continue;

            let passedCases = 0;
            const testCaseResults = [];

            for (const tc of question.testCases) {
                try {
                    const result = await executeCode(sub.language, sub.code, tc.input || '');
                    const cleanOutput = (result.output || '').trim();
                    const cleanExpected = (tc.output || '').trim();
                    
                    const isMatch = !result.error && cleanOutput === cleanExpected;
                    if (isMatch) passedCases++;

                    testCaseResults.push({
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        output: tc.isHidden ? 'Hidden' : cleanOutput,
                        expected: tc.isHidden ? 'Hidden' : cleanExpected,
                        passed: isMatch,
                        isHidden: tc.isHidden
                    });
                } catch (err) {
                    console.error(`Error running test case:`, err.message);
                    testCaseResults.push({
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        error: 'Execution Error',
                        passed: false,
                        isHidden: tc.isHidden
                    });
                }
            }

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

// ─── Pre-Evaluated Submission (browser-based execution) ─────

exports.submitEvaluated = async (req, res) => {
    try {
        const { testId, sectionSubmissions, totalScore } = req.body;
        
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

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
