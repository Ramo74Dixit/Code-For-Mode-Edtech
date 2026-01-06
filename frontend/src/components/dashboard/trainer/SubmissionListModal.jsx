import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, Download, CheckCircle, Clock } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

const SubmissionListModal = ({ assignment, onClose }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingSubmission, setGradingSubmission] = useState(null); // The submission currently being graded
    const [marks, setMarks] = useState('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        fetchSubmissions();
    }, [assignment]);

    const fetchSubmissions = async () => {
        try {
            const res = await api.get(`/assignments/${assignment._id}/submissions`);
            setSubmissions(res.data.data);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/assignments/${assignment._id}/grade/${gradingSubmission._id}`, {
                marks,
                feedback
            });
            
            // Update local state
            setSubmissions(submissions.map(sub => 
                sub._id === gradingSubmission._id ? res.data.data : sub
            ));
            
            setGradingSubmission(null);
            setMarks('');
            setFeedback('');
            alert("Graded successfully!");
        } catch (error) {
            console.error("Grading failed", error);
            alert("Failed to save grade.");
        }
    };

    const startGrading = (sub) => {
        setGradingSubmission(sub);
        setMarks(sub.marks || '');
        setFeedback(sub.feedback || '');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-card rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Submissions: {assignment.title}</h2>
                        <p className="text-sm text-muted-foreground">Total: {submissions.length} | Max Marks: {assignment.maxMarks}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Left: List of Submissions */}
                    <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${gradingSubmission ? 'hidden md:block' : ''}`}>
                        {loading ? (
                            <div className="text-center py-10">Loading...</div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No submissions yet.</div>
                        ) : (
                            submissions.map(sub => (
                                <div 
                                    key={sub._id} 
                                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${gradingSubmission?._id === sub._id ? 'border-primary bg-primary/5' : ''}`}
                                    onClick={() => startGrading(sub)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {sub.student?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">{sub.student?.name || 'Unknown Student'}</h4>
                                                <p className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        {sub.status === 'graded' ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                                                <CheckCircle className="h-3 w-3" /> {sub.marks}/{assignment.maxMarks}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right: Grading Panel */}
                    {gradingSubmission ? (
                        <div className="w-full md:w-1/2 border-l bg-muted/10 flex flex-col h-full overflow-y-auto">
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-lg mb-4">Grading {gradingSubmission.student?.name}'s Work</h3>
                                    
                                    <div className="space-y-3">
                                        {gradingSubmission.submissionLink && (
                                            <div className="p-3 bg-card border rounded-md">
                                                <span className="text-xs text-muted-foreground block mb-1">Link Submitted</span>
                                                <a href={gradingSubmission.submissionLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 text-sm break-all">
                                                    <ExternalLink className="h-4 w-4 shrink-0" />
                                                    {gradingSubmission.submissionLink}
                                                </a>
                                            </div>
                                        )}
                                        {gradingSubmission.fileUrl && (
                                            <div className="p-3 bg-card border rounded-md">
                                                <span className="text-xs text-muted-foreground block mb-1">File Uploaded</span>
                                                <a href={gradingSubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 text-sm break-all">
                                                    <Download className="h-4 w-4 shrink-0" />
                                                    View / Download File
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={handleGradeSubmit} className="space-y-4 pt-6 border-t">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Marks (Out of {assignment.maxMarks})</label>
                                        <Input 
                                            type="number" 
                                            max={assignment.maxMarks} 
                                            value={marks} 
                                            onChange={(e) => setMarks(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Feedback</label>
                                        <Textarea 
                                            placeholder="Great work! Improves on..." 
                                            value={feedback} 
                                            onChange={(e) => setFeedback(e.target.value)} 
                                            rows={4} 
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setGradingSubmission(null)}>Cancel</Button>
                                        <Button type="submit">Save Grade</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex w-1/2 flex-col items-center justify-center text-muted-foreground p-6 border-l bg-muted/10">
                            <FileText className="h-12 w-12 mb-2 opacity-20" />
                            <p>Select a submission to grade</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionListModal;
