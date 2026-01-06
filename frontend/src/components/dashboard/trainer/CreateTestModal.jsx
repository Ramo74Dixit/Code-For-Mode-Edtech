import React, { useState } from 'react';
import { X, Plus, Trash2, Code } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

const CreateTestModal = ({ batchId, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Test Details, 2: Questions
    const [loading, setLoading] = useState(false);

    // Test Details
    const [testData, setTestData] = useState({
        title: '',
        description: '',
        duration: 60,
        startTime: '',
        endTime: ''
    });

    // Questions State
    const [questions, setQuestions] = useState([
        {
            problemTitle: '',
            problemDescription: '',
            difficulty: 'Medium',
            points: 10,
            testCases: [
                { input: '', output: '', isHidden: false }
            ]
        }
    ]);

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            problemTitle: '',
            problemDescription: '',
            difficulty: 'Medium',
            points: 10,
            testCases: [{ input: '', output: '', isHidden: false }]
        }]);
    };

    const handleRemoveQuestion = (index) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleAddTestCase = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].testCases.push({ input: '', output: '', isHidden: false });
        setQuestions(newQuestions);
    };

    const handleRemoveTestCase = (qIndex, tIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].testCases.length === 1) return;
        newQuestions[qIndex].testCases.splice(tIndex, 1);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const updateTestCase = (qIndex, tIndex, field, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].testCases[tIndex][field] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...testData,
                batchId,
                questions
            };
            
            await api.post('/tests', payload);
            alert("Test Created Successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Test creation failed", error);
            alert(error.response?.data?.message || "Failed to create test");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-card rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <h2 className="text-xl font-bold">Create Coding Test</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {step === 1 ? (
                        <div className="space-y-4 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Test Title</label>
                                <Input 
                                    placeholder="e.g. DSA Weekly Contest 1"
                                    value={testData.title}
                                    onChange={(e) => setTestData({...testData, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea 
                                    placeholder="Brief details about the test..."
                                    value={testData.description}
                                    onChange={(e) => setTestData({...testData, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Duration (Minutes)</label>
                                    <Input 
                                        type="number"
                                        value={testData.duration}
                                        onChange={(e) => setTestData({...testData, duration: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Time</label>
                                    <Input 
                                        type="datetime-local"
                                        value={testData.startTime}
                                        onChange={(e) => setTestData({...testData, startTime: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {questions.map((q, qIndex) => (
                                <div key={qIndex} className="border rounded-lg p-6 space-y-4 relative bg-muted/20">
                                    <div className="absolute top-4 right-4">
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveQuestion(qIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Code className="h-4 w-4" /> Question {qIndex + 1}
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase font-medium">Problem Title</label>
                                            <Input 
                                                value={q.problemTitle}
                                                onChange={(e) => updateQuestion(qIndex, 'problemTitle', e.target.value)}
                                                placeholder="e.g. Two Sum"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                             <div className="space-y-2 flex-1">
                                                <label className="text-xs uppercase font-medium">Difficulty</label>
                                                <select 
                                                    className="w-full h-10 px-3 bg-background border rounded-md text-sm"
                                                    value={q.difficulty}
                                                    onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                                                >
                                                    <option>Easy</option>
                                                    <option>Medium</option>
                                                    <option>Hard</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2 w-24">
                                                <label className="text-xs uppercase font-medium">Points</label>
                                                <Input 
                                                    type="number"
                                                    value={q.points}
                                                    onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-medium">Problem Statement (Markdown)</label>
                                        <Textarea 
                                            rows={4}
                                            value={q.problemDescription}
                                            onChange={(e) => updateQuestion(qIndex, 'problemDescription', e.target.value)}
                                            placeholder="Given an array of integers..."
                                        />
                                    </div>

                                    {/* Test Cases */}
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold">Test Cases</label>
                                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddTestCase(qIndex)}>
                                                <Plus className="h-3 w-3 mr-2" /> Add Case
                                            </Button>
                                        </div>
                                        
                                        {q.testCases.map((tc, tIndex) => (
                                            <div key={tIndex} className="flex gap-2 items-start">
                                                <div className="flex-1 space-y-1">
                                                    <Textarea 
                                                        placeholder="Input (e.g. 1 2)" 
                                                        rows={1}
                                                        value={tc.input} 
                                                        onChange={(e) => updateTestCase(qIndex, tIndex, 'input', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                     <Textarea 
                                                        placeholder="Expected Output (e.g. 3)" 
                                                        rows={1}
                                                        value={tc.output} 
                                                        onChange={(e) => updateTestCase(qIndex, tIndex, 'output', e.target.value)}
                                                    />
                                                </div>
                                                <Button variant="ghost" size="icon" className="mt-1 opacity-50 hover:opacity-100" onClick={() => handleRemoveTestCase(qIndex, tIndex)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            <Button type="button" variant="outline" className="w-full border-dashed py-6" onClick={handleAddQuestion}>
                                <Plus className="h-4 w-4 mr-2" /> Add Another Question
                            </Button>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-muted/10 flex justify-between shrink-0">
                    {step === 2 ? (
                         <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    ) : (
                        <div />
                    )}
                    
                    {step === 1 ? (
                        <Button onClick={() => setStep(2)}>Next: Add Questions</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Creating Test...' : 'Create Test'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateTestModal;
