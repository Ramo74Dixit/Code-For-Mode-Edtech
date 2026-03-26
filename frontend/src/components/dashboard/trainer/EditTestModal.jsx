import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Code, Loader2, Save } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import DateTimePicker from '../../ui/DateTimePicker';

const EditTestModal = ({ testId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [testData, setTestData] = useState({
        title: '',
        description: '',
        duration: 60,
        startTime: null,
    });

    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        fetchTest();
    }, [testId]);

    const fetchTest = async () => {
        try {
            const res = await api.get(`/tests/${testId}`);
            const test = res.data.data;
            setTestData({
                title: test.title || '',
                description: test.description || '',
                duration: test.duration || 60,
                startTime: test.startTime ? new Date(test.startTime) : null,
            });
            setQuestions(test.questions || []);
        } catch (err) {
            console.error('Failed to fetch test:', err);
            alert('Failed to load test data');
        } finally {
            setLoading(false);
        }
    };

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
        const newQ = [...questions];
        newQ[qIndex].testCases.push({ input: '', output: '', isHidden: false });
        setQuestions(newQ);
    };

    const handleRemoveTestCase = (qIndex, tIndex) => {
        const newQ = [...questions];
        if (newQ[qIndex].testCases.length === 1) return;
        newQ[qIndex].testCases.splice(tIndex, 1);
        setQuestions(newQ);
    };

    const updateQuestion = (index, field, value) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        setQuestions(newQ);
    };

    const updateTestCase = (qIndex, tIndex, field, value) => {
        const newQ = [...questions];
        newQ[qIndex].testCases[tIndex][field] = value;
        setQuestions(newQ);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...testData,
                startTime: testData.startTime ? testData.startTime.toISOString() : '',
                questions
            };
            await api.put(`/tests/${testId}`, payload);
            alert('Test updated successfully!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Update failed:', error);
            alert(error.response?.data?.message || 'Failed to update test');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-card rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Code className="h-5 w-5 text-indigo-400" /> Edit Test
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Test Details */}
                        <div className="space-y-4 p-4 bg-muted/10 rounded-lg border">
                            <h3 className="text-sm font-bold uppercase text-muted-foreground">Test Details</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Test Title</label>
                                    <Input
                                        value={testData.title}
                                        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Duration (Min)</label>
                                        <Input
                                            type="number"
                                            value={testData.duration}
                                            onChange={(e) => setTestData({ ...testData, duration: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Start Time</label>
                                        <DateTimePicker
                                            selected={testData.startTime}
                                            onChange={(date) => setTestData({ ...testData, startTime: date })}
                                            placeholderText="Pick start time"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={testData.description}
                                    onChange={(e) => setTestData({ ...testData, description: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-6">
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
                                        />
                                    </div>

                                    {/* Test Cases */}
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-sm font-semibold">Test Cases</label>
                                                <p className="text-[11px] text-muted-foreground">Visible = example for students. Hidden = grading only.</p>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => handleAddTestCase(qIndex)}>
                                                <Plus className="h-3 w-3 mr-2" /> Add Case
                                            </Button>
                                        </div>

                                        {q.testCases.map((tc, tIndex) => (
                                            <div key={tIndex} className={`rounded-lg border p-3 space-y-2 ${tc.isHidden ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-muted/10'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-muted-foreground">Case {tIndex + 1}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateTestCase(qIndex, tIndex, 'isHidden', !tc.isHidden)}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                                                                tc.isHidden
                                                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            }`}
                                                        >
                                                            {tc.isHidden ? '🔒 Hidden' : '👁 Visible'}
                                                        </button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => handleRemoveTestCase(qIndex, tIndex)}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-medium text-muted-foreground">Input</label>
                                                        <Textarea
                                                            placeholder="e.g. 1 2"
                                                            rows={2}
                                                            className="font-mono text-xs"
                                                            value={tc.input}
                                                            onChange={(e) => updateTestCase(qIndex, tIndex, 'input', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-medium text-muted-foreground">Expected Output</label>
                                                        <Textarea
                                                            placeholder="e.g. 3"
                                                            rows={2}
                                                            className="font-mono text-xs"
                                                            value={tc.output}
                                                            onChange={(e) => updateTestCase(qIndex, tIndex, 'output', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" className="w-full border-dashed py-6" onClick={handleAddQuestion}>
                                <Plus className="h-4 w-4 mr-2" /> Add Another Question
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-6 border-t bg-muted/10 flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditTestModal;
