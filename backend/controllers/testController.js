const Test = require('../models/Test');
const TestSubmission = require('../models/TestSubmission');
const Batch = require('../models/Batch');
const axios = require('axios');

// Language config for multiple execution APIs
const LANG_CONFIG = {
    'javascript': { piston: { language: 'javascript', version: '18.15.0' }, codex: 'js', file: 'main.js' },
    'python':     { piston: { language: 'python', version: '3.10.0' },     codex: 'py', file: 'main.py' },
    'cpp':        { piston: { language: 'cpp', version: '10.2.0' },        codex: 'cpp', file: 'main.cpp' },
    'java':       { piston: { language: 'java', version: '15.0.2' },       codex: 'java', file: 'Main.java' }
};

// Execute code using multiple fallback APIs
const executeCode = async (language, sourceCode, input) => {
    const config = LANG_CONFIG[language.toLowerCase()];
    if (!config) throw new Error('Unsupported language');

    // API 1: Try Piston
    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: config.piston.language,
            version: config.piston.version,
            files: [{ content: sourceCode }],
            stdin: input || ""
        }, { timeout: 10000 });
        
        const { run, compile } = response.data;
        if (compile && compile.stderr) return { output: '', error: compile.stderr };
        return { output: run.stdout || '', error: run.stderr || '' };
    } catch (e) {
        console.log('Piston failed, trying CodeX...', e.message);
    }

    // API 2: Try CodeX API (free, no auth)
    try {
        const response = await axios.post('https://api.codex.jaagrav.in', {
            code: sourceCode,
            language: config.codex,
            input: input || ""
        }, { timeout: 15000 });
        
        return {
            output: response.data.output || '',
            error: response.data.error || ''
        };
    } catch (e) {
        console.log('CodeX also failed:', e.message);
    }

    throw new Error('All code execution services are currently unavailable. Please try again later.');
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
        
        if (!LANG_CONFIG[language.toLowerCase()]) {
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

// ─── Test Submission (backend evaluates via API) ─────────────────

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
                    console.error(`Error running test case for Q ${question.problemTitle}:`, err.message);
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

// ─── Pre-Evaluated Submission (browser-based execution) ─────────

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
