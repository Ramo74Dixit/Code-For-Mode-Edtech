import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CodeEditor from '../../components/ide/CodeEditor';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Loader2, Play, CheckCircle, XCircle, ChevronLeft, ChevronRight, Timer, ArrowRight, Trophy, Send } from 'lucide-react';

const TestArena = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submissionResult, setSubmissionResult] = useState(null);
    
    // Test State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    
    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);
    
    // Execution & Test Case State
    const [isRunning, setIsRunning] = useState(false);
    const [testCaseResults, setTestCaseResults] = useState({}); // { questionId: [{ passed, input, output, expected }] }
    const [questionScores, setQuestionScores] = useState({}); // { questionId: score }
    const [allPassed, setAllPassed] = useState(false); // Whether current question's all test cases passed
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data.data);
                
                const durationMins = res.data.data.duration || 60;
                setTimeLeft(durationMins * 60);
                
                const initialAnswers = {};
                res.data.data.questions.forEach(q => {
                    initialAnswers[q._id] = {
                        code: '// Write your code here\n',
                        language: 'javascript' 
                    };
                });
                setAnswers(initialAnswers);
            } catch (error) {
                console.error("Failed to load test", error);
                alert("Failed to load test");
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [id]);

    // Countdown Timer
    useEffect(() => {
        if (timeLeft <= 0 && test) {
            clearInterval(timerRef.current);
            if (test && !submissionResult) {
                alert("⏰ Time's up! Auto-submitting your test...");
                handleFinalSubmit(true);
            }
            return;
        }
        
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        
        return () => clearInterval(timerRef.current);
    }, [timeLeft, test]);

    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isTimeLow = timeLeft <= 300;
    const currentQuestion = test?.questions[currentQuestionIndex];
    const currentResults = currentQuestion ? testCaseResults[currentQuestion._id] : null;
    const totalScore = Object.values(questionScores).reduce((sum, s) => sum + s, 0);
    const solvedCount = Object.values(questionScores).filter(s => s > 0).length;

    const handleCodeChange = (value) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: { ...prev[currentQuestion._id], code: value }
        }));
        // Reset test case results when code changes
        if (currentResults) {
            setTestCaseResults(prev => {
                const next = { ...prev };
                delete next[currentQuestion._id];
                return next;
            });
            setAllPassed(false);
        }
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setActiveLanguage(lang);
        setAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: { ...prev[currentQuestion._id], language: lang }
        }));
    };

    // Browser-based JavaScript execution (sandboxed)
    const executeJS = (code, input) => {
        return new Promise((resolve) => {
            const logs = [];
            try {
                const sandboxConsole = {
                    log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                    error: (...args) => logs.push(args.map(a => String(a)).join(' ')),
                    warn: (...args) => logs.push(args.map(a => String(a)).join(' ')),
                    info: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                };

                const wrappedCode = `
                    const console = __sc__;
                    const input = __inp__;
                    const readline = () => input;
                    ${code}
                `;

                const fn = new Function('__sc__', '__inp__', wrappedCode);
                
                let finished = false;
                const timer = setTimeout(() => {
                    if (!finished) { finished = true; resolve({ output: '', error: 'Execution timed out (5s). Check for infinite loops.' }); }
                }, 5000);

                fn(sandboxConsole, input);
                finished = true;
                clearTimeout(timer);

                resolve({ output: logs.join('\n'), error: '' });
            } catch (err) {
                resolve({ output: '', error: `${err.name}: ${err.message}` });
            }
        });
    };

    // Run code against ALL test cases for current question
    const runCode = async () => {
        if (!currentQuestion) return;
        setIsRunning(true);
        setAllPassed(false);
        
        const currentAnswer = answers[currentQuestion._id];
        const results = [];
        let passed = 0;

        try {
            for (const tc of currentQuestion.testCases) {
                if (activeLanguage === 'javascript') {
                    const result = await executeJS(currentAnswer.code, tc.input || '');
                    const actualOutput = (result.output || '').trim();
                    const expectedOutput = (tc.output || '').trim();
                    const isMatch = !result.error && actualOutput === expectedOutput;
                    if (isMatch) passed++;

                    results.push({
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        output: result.error ? `Error: ${result.error}` : (tc.isHidden ? 'Hidden' : actualOutput),
                        expected: tc.isHidden ? 'Hidden' : expectedOutput,
                        passed: isMatch,
                        isHidden: tc.isHidden
                    });
                } else {
                    // Backend API fallback for other languages
                    try {
                        const res = await api.post('/tests/run', {
                            language: activeLanguage,
                            sourceCode: currentAnswer.code,
                            input: tc.input || ''
                        });
                        const r = res.data.data;
                        const actualOutput = (r.output || '').trim();
                        const expectedOutput = (tc.output || '').trim();
                        const isMatch = !r.error && actualOutput === expectedOutput;
                        if (isMatch) passed++;

                        results.push({
                            input: tc.isHidden ? 'Hidden' : tc.input,
                            output: r.error ? `Error: ${r.error}` : (tc.isHidden ? 'Hidden' : actualOutput),
                            expected: tc.isHidden ? 'Hidden' : expectedOutput,
                            passed: isMatch,
                            isHidden: tc.isHidden
                        });
                    } catch (err) {
                        results.push({
                            input: tc.isHidden ? 'Hidden' : tc.input,
                            output: 'Execution service unavailable',
                            expected: tc.isHidden ? 'Hidden' : tc.output,
                            passed: false,
                            isHidden: tc.isHidden
                        });
                    }
                }
            }

            // Save results
            setTestCaseResults(prev => ({ ...prev, [currentQuestion._id]: results }));

            // Calculate score for this question
            const score = Math.round((passed / currentQuestion.testCases.length) * currentQuestion.points);
            setQuestionScores(prev => ({ ...prev, [currentQuestion._id]: score }));

            // Check if all passed
            const allMatch = passed === currentQuestion.testCases.length;
            setAllPassed(allMatch);

        } catch (error) {
            console.error("Execution failed", error);
        } finally {
            setIsRunning(false);
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setAllPassed(false);
        }
    };

    // Final submit
    const handleFinalSubmit = async (forced = false) => {
        if (!forced && !window.confirm("Are you sure you want to submit the test?")) return;
        setIsSubmitting(true);
        
        try {
            // Evaluate any un-evaluated questions
            let finalTotalScore = 0;
            const allResults = [];

            for (const q of test.questions) {
                const answer = answers[q._id];
                let results = testCaseResults[q._id];

                // If this question wasn't run yet, evaluate now
                if (!results && answer.language === 'javascript') {
                    results = [];
                    let pc = 0;
                    for (const tc of q.testCases) {
                        const result = await executeJS(answer.code, tc.input || '');
                        const actual = (result.output || '').trim();
                        const expected = (tc.output || '').trim();
                        const isMatch = !result.error && actual === expected;
                        if (isMatch) pc++;
                        results.push({ input: tc.isHidden ? 'Hidden' : tc.input, output: tc.isHidden ? 'Hidden' : actual, expected: tc.isHidden ? 'Hidden' : expected, passed: isMatch, isHidden: tc.isHidden });
                    }
                    const score = Math.round((pc / q.testCases.length) * q.points);
                    finalTotalScore += score;
                    allResults.push({ questionId: q._id, code: answer.code, language: answer.language, passedCases: pc, totalCases: q.testCases.length, score, testCaseResults: results });
                } else if (results) {
                    const pc = results.filter(r => r.passed).length;
                    const score = questionScores[q._id] || 0;
                    finalTotalScore += score;
                    allResults.push({ questionId: q._id, code: answer.code, language: answer.language, passedCases: pc, totalCases: q.testCases.length, score, testCaseResults: results });
                } else {
                    // Non-JS, not yet evaluated — send with 0 score
                    allResults.push({ questionId: q._id, code: answer.code, language: answer.language, passedCases: 0, totalCases: q.testCases.length, score: 0, testCaseResults: [] });
                }
            }

            const res = await api.post('/tests/submit-evaluated', {
                testId: id,
                sectionSubmissions: allResults,
                totalScore: finalTotalScore
            });

            setSubmissionResult(res.data.data);
            clearInterval(timerRef.current);
            
        } catch (error) {
            console.error(error);
            alert("Submission failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-3" /> Loading Test...
        </div>
    );
    if (!test) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white">Test not found</div>;

    // ─── Results Screen ─────────────────────────
    if (submissionResult) {
        const maxPossible = test.questions.reduce((sum, q) => sum + q.points, 0);
        const pct = maxPossible > 0 ? Math.round((submissionResult.totalScore / maxPossible) * 100) : 0;
        
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <div className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center ${pct >= 70 ? 'bg-emerald-500/20' : pct >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                            <Trophy className={`h-10 w-10 ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`} />
                        </div>
                        <h1 className="text-3xl font-bold">Test Complete!</h1>
                        <p className="text-slate-400">
                            {pct >= 70 ? 'Great job! 🎉' : pct >= 40 ? 'Good effort! Keep practicing. 💪' : 'Don\'t give up! Review and try again. 📚'}
                        </p>
                    </div>
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <span className="text-sm text-slate-500 uppercase tracking-wider font-bold">Total Score</span>
                        <div className={`text-6xl font-extrabold mt-2 ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {submissionResult.totalScore}
                            <span className="text-2xl text-slate-600">/{maxPossible}</span>
                        </div>
                        <div className="mt-3 h-3 bg-slate-800 rounded-full overflow-hidden max-w-xs mx-auto">
                            <div className={`h-full rounded-full transition-all duration-1000 ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {submissionResult.sectionSubmissions?.map((section, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    {section.passedCases === section.totalCases ? (
                                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-400" />
                                    )}
                                    <span className="font-medium">Question {idx + 1}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-400">
                                        {section.passedCases}/{section.totalCases} passed
                                    </span>
                                    <span className={`font-bold px-3 py-1 rounded-full text-sm ${section.score > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        +{section.score}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="text-center">
                        <Button onClick={() => navigate(-1)} className="bg-indigo-600 hover:bg-indigo-500 px-8">
                            ← Back to Classroom
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

    // ─── Main Test UI ─────────────────────────
    return (
        <div className="h-screen flex flex-col bg-slate-950 text-white">
            {/* Header */}
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-lg">{test.title}</h1>
                    <span className="text-sm text-slate-400 border-l border-slate-700 pl-4">
                        Q {currentQuestionIndex + 1}/{test.questions.length}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Running Score */}
                    <div className="flex items-center gap-2 text-sm font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/20">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>{totalScore} pts</span>
                        <span className="text-emerald-600">({solvedCount}/{test.questions.length})</span>
                    </div>

                    <div className={`flex items-center gap-2 text-sm font-mono px-3 py-1 rounded-lg ${
                        isTimeLow ? 'bg-red-500/10 text-red-400 animate-pulse border border-red-500/30' : 'bg-slate-800 text-white'
                    }`}>
                        <Timer className="h-4 w-4" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleFinalSubmit(false)}
                        disabled={isSubmitting}
                        className="gap-1"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Submit Test
                    </Button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem Statement */}
                <div className="w-[35%] border-r border-slate-800 overflow-y-auto p-6 bg-slate-950">
                    <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.problemTitle}</h2>
                    <div className="text-sm text-slate-300 mb-6 whitespace-pre-wrap leading-relaxed">
                        {currentQuestion.problemDescription}
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">Sample Test Cases</h3>
                        {currentQuestion.testCases?.filter(tc => !tc.isHidden).slice(0, 2).map((tc, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-sm font-mono space-y-2">
                                <div>
                                    <span className="text-slate-500 text-xs block mb-1">Input:</span>
                                    <div className="bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 whitespace-pre-wrap">{tc.input}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-xs block mb-1">Expected Output:</span>
                                    <div className="bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 whitespace-pre-wrap">{tc.output}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Editor & Results */}
                <div className="w-[65%] flex flex-col">
                    {/* Toolbar */}
                    <div className="h-11 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
                        <select 
                            className="bg-slate-800 text-sm border border-slate-700 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={activeLanguage}
                            onChange={handleLanguageChange}
                        >
                            <option value="javascript">JavaScript (Node.js 18)</option>
                            <option value="python">Python 3.10</option>
                            <option value="java">Java 15</option>
                            <option value="cpp">C++ (GCC)</option>
                        </select>
                        
                        <Button 
                            size="sm" 
                            onClick={runCode} 
                            disabled={isRunning} 
                            className="gap-2 bg-indigo-600 hover:bg-indigo-500"
                        >
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Run & Test
                        </Button>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 min-h-0">
                         <CodeEditor 
                            language={activeLanguage}
                            value={answers[currentQuestion._id]?.code || ''}
                            onChange={handleCodeChange}
                         />
                    </div>

                    {/* Test Case Results Panel */}
                    <div className="h-[40%] border-t border-slate-800 bg-slate-950 flex flex-col shrink-0 overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Results</span>
                            {currentResults && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    allPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    {currentResults.filter(r => r.passed).length}/{currentResults.length} Passed
                                </span>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4">
                            {!currentResults ? (
                                <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
                                    Click "Run & Test" to check your code against all test cases
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {currentResults.map((tc, i) => (
                                        <div key={i} className={`p-3 rounded-lg border text-sm font-mono ${
                                            tc.passed 
                                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                                : 'bg-red-500/5 border-red-500/20'
                                        }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                                                    Test Case {i + 1} {tc.isHidden ? '(Hidden)' : ''}
                                                </span>
                                                {tc.passed ? (
                                                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                                        <CheckCircle className="h-3.5 w-3.5" /> PASSED
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                                                        <XCircle className="h-3.5 w-3.5" /> FAILED
                                                    </span>
                                                )}
                                            </div>
                                            {!tc.isHidden && (
                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-slate-500 block mb-0.5">Input</span>
                                                        <div className="bg-black/30 p-1.5 rounded whitespace-pre-wrap text-slate-300">{tc.input || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block mb-0.5">Your Output</span>
                                                        <div className={`bg-black/30 p-1.5 rounded whitespace-pre-wrap ${tc.passed ? 'text-emerald-300' : 'text-red-300'}`}>{tc.output || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block mb-0.5">Expected</span>
                                                        <div className="bg-black/30 p-1.5 rounded whitespace-pre-wrap text-slate-300">{tc.expected || '—'}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Action after results */}
                                    <div className="pt-4 flex justify-center">
                                        {allPassed ? (
                                            isLastQuestion ? (
                                                <Button 
                                                    onClick={() => handleFinalSubmit(false)} 
                                                    className="bg-emerald-600 hover:bg-emerald-500 gap-2 px-6 shadow-lg shadow-emerald-600/20"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                                                    All Passed! Submit Test 🎉
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={goToNextQuestion} 
                                                    className="bg-emerald-600 hover:bg-emerald-500 gap-2 px-6 shadow-lg shadow-emerald-600/20"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    All Passed! Next Question
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            )
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <p className="text-red-400 text-sm">Some test cases failed. Fix your code and try again.</p>
                                                <div className="flex gap-3 justify-center">
                                                    {!isLastQuestion && (
                                                        <Button variant="outline" size="sm" onClick={goToNextQuestion} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                                            Skip → Next Question
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => handleFinalSubmit(false)} 
                                                        className="border-red-800 text-red-400 hover:bg-red-500/10"
                                                        disabled={isSubmitting}
                                                    >
                                                        Submit Test Anyway
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer: Question Navigation */}
            <div className="h-12 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { setCurrentQuestionIndex(prev => Math.max(0, prev - 1)); setAllPassed(false); }}
                    disabled={currentQuestionIndex === 0}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                
                <div className="flex gap-2">
                    {test.questions.map((q, i) => {
                        const isSolved = questionScores[q._id] > 0;
                        const hasResults = !!testCaseResults[q._id];
                        return (
                            <button 
                                key={i} 
                                onClick={() => { setCurrentQuestionIndex(i); setAllPassed(false); }}
                                className={`
                                    h-8 w-8 rounded-lg text-xs font-bold transition-all
                                    ${i === currentQuestionIndex 
                                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' 
                                        : isSolved 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : hasResults 
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'}
                                `}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>

                <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => { setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1)); setAllPassed(false); }}
                    disabled={isLastQuestion}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
};

export default TestArena;
