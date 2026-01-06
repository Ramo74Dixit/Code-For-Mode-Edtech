import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CodeEditor from '../../components/ide/CodeEditor';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Loader2, Play, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Timer } from 'lucide-react';

const TestArena = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Test State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: { code: "...", language: "..." } }
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    
    // Execution State
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState(null);
    const [executionError, setExecutionError] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await api.get(`/tests/${id}`);
                setTest(res.data.data);
                
                // Initialize answers state
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

    const currentQuestion = test?.questions[currentQuestionIndex];

    const handleCodeChange = (value) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: {
                ...prev[currentQuestion._id],
                code: value
            }
        }));
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setActiveLanguage(lang);
        setAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: {
                ...prev[currentQuestion._id],
                language: lang
            }
        }));
    };

    const runCode = async () => {
        if (!currentQuestion) return;
        setIsRunning(true);
        setOutput(null);
        setExecutionError(false);
        
        const currentAnswer = answers[currentQuestion._id];
        
        try {
            // Use the first test case input for "Run Code"
            const sampleInput = currentQuestion.testCases?.[0]?.input || "";
            
            const res = await api.post('/tests/run', {
                language: activeLanguage,
                sourceCode: currentAnswer.code,
                input: sampleInput
            });
            
            const result = res.data.data;
            if (result.error) {
                setOutput(result.error);
                setExecutionError(true);
            } else {
                setOutput(result.output);
                
                // Basic validation against sample output if available
                const expectedOutput = currentQuestion.testCases?.[0]?.output?.trim();
                const actualOutput = result.output?.trim();
                
                if (expectedOutput && actualOutput === expectedOutput) {
                    // Visual indicator logic could go here
                }
            }

        } catch (error) {
            console.error("Execution failed", error);
            setOutput("Execution failed: " + (error.response?.data?.message || error.message));
            setExecutionError(true);
        } finally {
            setIsRunning(false);
        }
    };

    const submitTest = async () => {
        if (!window.confirm("Are you sure you want to submit the test? You cannot undo this action.")) return;
        
        try {
            // Transform answers to needed format
            const submissions = Object.keys(answers).map(qId => ({
                questionId: qId,
                code: answers[qId].code,
                language: answers[qId].language
            }));

            await api.post('/tests/submit', {
                testId: id,
                submissions
            });

            alert("Test Submitted Successfully!");
            navigate(-1); // Go back
            
        } catch (error) {
            alert("Submission failed: " + error.message);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Test Environment...</div>;
    if (!test) return <div className="p-10 text-center">Test not found</div>;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-lg">{test.title}</h1>
                    <span className="text-sm text-muted-foreground border-l pl-4">
                        Question {currentQuestionIndex + 1} of {test.questions.length}
                    </span>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-mono bg-muted px-3 py-1 rounded">
                        <Timer className="h-4 w-4" />
                        <span>00:59:00</span>
                    </div>
                    <Button variant="destructive" onClick={submitTest}>Submit Test</Button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Problem Statement */}
                <div className="w-1/3 border-r overflow-y-auto p-6 bg-card/50">
                    <h2 className="text-xl font-bold mb-4">{currentQuestion.problemTitle}</h2>
                    <div className="prose dark:prose-invert max-w-none text-sm mb-8">
                        {currentQuestion.problemDescription}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Sample Test Cases</h3>
                        {currentQuestion.testCases?.slice(0, 2).map((tc, i) => (
                            <div key={i} className="bg-muted/50 p-3 rounded-md text-sm font-mono space-y-2">
                                <div>
                                    <span className="text-muted-foreground text-xs block mb-1">Input:</span>
                                    <div className="bg-background border p-2 rounded">{tc.input}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs block mb-1">Expected Output:</span>
                                    <div className="bg-background border p-2 rounded">{tc.output}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Editor & Console */}
                <div className="w-2/3 flex flex-col">
                    {/* Toolbar */}
                    <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/20">
                        <select 
                            className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer font-medium"
                            value={activeLanguage}
                            onChange={handleLanguageChange}
                        >
                            <option value="javascript">JavaScript (Node.js 18)</option>
                            <option value="python">Python 3.10</option>
                            <option value="java">Java 15</option>
                            <option value="cpp">C++ (GCC)</option>
                        </select>
                        
                        <Button size="sm" onClick={runCode} disabled={isRunning} className="gap-2">
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Run Code
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

                    {/* Output Console */}
                    <div className="h-1/3 border-t bg-black/90 text-white font-mono text-sm flex flex-col shrink-0">
                         <div className="p-2 border-b border-white/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                             Console Output
                         </div>
                         <div className="p-4 overflow-auto flex-1 whitespace-pre-wrap">
                             {output ? (
                                 <span className={executionError ? "text-red-400" : "text-green-400"}>
                                     {output}
                                 </span>
                             ) : (
                                 <span className="text-white/30 italic">Run your code to see output here...</span>
                             )}
                         </div>
                    </div>
                </div>
            </div>
            
            {/* Footer Navigation */}
            <div className="h-14 border-t bg-card px-6 flex items-center justify-between shrink-0">
                <Button 
                    variant="ghost" 
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                
                <div className="flex gap-2">
                    {test.questions.map((_, i) => (
                        <div 
                            key={i} 
                            onClick={() => setCurrentQuestionIndex(i)}
                            className={`h-2 w-2 rounded-full cursor-pointer transition-colors ${i === currentQuestionIndex ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground'}`}
                        />
                    ))}
                </div>

                <Button 
                    variant="ghost"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === test.questions.length - 1}
                >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
};

export default TestArena;
