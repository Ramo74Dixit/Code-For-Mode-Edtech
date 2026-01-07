import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeft, Search, Eye, Code, X } from 'lucide-react';
import api from '../../../services/api';

const TestResultsModal = ({ testId, testTitle, onClose }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await api.get(`/tests/${testId}/submissions`);
                setSubmissions(res.data.data);
            } catch (error) {
                console.error("Failed to load submissions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [testId]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl bg-card rounded-xl shadow-xl flex flex-col h-[80vh]">
                <div className="h-16 border-b flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                         <div className="flex flex-col">
                            <h2 className="text-xl font-bold">{testTitle} - Results</h2>
                            <span className="text-xs text-muted-foreground">{submissions.length} Submissions</span>
                         </div>
                    </div>
                   <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                   </Button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* List */}
                    <div className={`${selectedSubmission ? 'w-1/3 border-r hidden md:block' : 'w-full'} overflow-y-auto`}>
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading results...</div>
                        ) : submissions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No students have attempted this test yet.</div>
                        ) : (
                            <div className="divide-y">
                                {submissions.map((sub) => (
                                    <div 
                                        key={sub._id} 
                                        onClick={() => setSelectedSubmission(sub)}
                                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${selectedSubmission?._id === sub._id ? 'bg-muted' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold">{sub.student?.name || 'Unknown Student'}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                sub.totalScore > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                Score: {sub.totalScore}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{sub.student?.email}</p>
                                        <div className="mt-2 text-xs flex gap-2">
                                            <span className="bg-muted px-1.5 py-0.5 rounded">
                                                Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail View */}
                    {selectedSubmission && (
                         <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/10 absolute md:static inset-0 z-10 bg-background">
                            <div className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedSubmission(null)}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <h3 className="font-semibold">{selectedSubmission.student?.name}'s Submission</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedSubmission.sectionSubmissions.map((sec, idx) => (
                                    <div key={idx} className="border rounded-lg bg-card overflow-hidden">
                                        <div className="bg-muted/30 p-3 border-b flex justify-between items-center">
                                            <span className="font-mono text-sm font-semibold">Question {idx + 1}</span>
                                            <span className="text-xs font-mono bg-background border px-2 py-1 rounded">
                                                {sec.passedCases}/{sec.totalCases} Passed • {sec.language}
                                            </span>
                                        </div>
                                        <div className="p-0">
                                            <pre className="p-4 text-xs font-mono overflow-x-auto bg-[#1e1e1e] text-[#d4d4d4] m-0">
                                                <code>{sec.code}</code>
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestResultsModal;
