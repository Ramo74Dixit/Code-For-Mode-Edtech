import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, CheckCircle, XCircle, Clock, FileText, Code, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import api from '../../../services/api';
import { format } from 'date-fns';

const StudentDetailModal = ({ studentId, batchId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchStudentDetails();
    }, [studentId, batchId]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/batches/${batchId}/students/${studentId}/details`);
            setData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch student details:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, attended) => {
        if (!attended) return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">Not Attempted</span>;
        if (status === 'submitted') return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Submitted</span>;
        if (status === 'graded') return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">Graded</span>;
        if (status === 'in_progress') return <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">In Progress</span>;
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">{status}</span>;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0 bg-slate-900/80">
                    <h2 className="text-xl font-bold text-white">Student Details</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                ) : !data ? (
                    <div className="text-center py-20 text-slate-500">Failed to load student details.</div>
                ) : (
                    <div className="overflow-y-auto flex-1 p-6 space-y-6">
                        
                        {/* Student Info Card */}
                        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-2xl text-indigo-400 font-bold border-2 border-indigo-500/20 overflow-hidden flex-shrink-0">
                                {data.student?.profileImage ? (
                                    <img src={data.student.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    data.student?.name?.[0]?.toUpperCase() || 'S'
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white">{data.student?.name}</h3>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />{data.student?.email}
                                    </span>
                                    {data.student?.phone && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5" />{data.student?.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Test Results */}
                        <div>
                            <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                <Code className="h-5 w-5 text-purple-400" />
                                Test Results
                                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-normal">
                                    {data.testResults?.filter(t => t.attended).length}/{data.testResults?.length} attended
                                </span>
                            </h4>
                            {data.testResults?.length > 0 ? (
                                <div className="space-y-2">
                                    {data.testResults.map((test, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {test.attended ? (
                                                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-400/50 flex-shrink-0" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white">{test.testTitle}</p>
                                                    {test.testDate && (
                                                        <p className="text-[11px] text-slate-500">{format(new Date(test.testDate), 'MMM d, yyyy h:mm a')}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {test.attended && (
                                                    <span className="text-lg font-bold text-white">{test.totalScore}<span className="text-slate-500 text-xs font-normal ml-0.5">pts</span></span>
                                                )}
                                                {getStatusBadge(test.status, test.attended)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                                    <p className="text-sm text-slate-500">No tests in this batch yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Assignment Results */}
                        <div>
                            <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-blue-400" />
                                Assignment Submissions
                                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-normal">
                                    {data.assignmentResults?.filter(a => a.submitted).length}/{data.assignmentResults?.length} submitted
                                </span>
                            </h4>
                            {data.assignmentResults?.length > 0 ? (
                                <div className="space-y-2">
                                    {data.assignmentResults.map((assignment, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {assignment.submitted ? (
                                                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <Clock className="h-5 w-5 text-orange-400/50 flex-shrink-0" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white">{assignment.title}</p>
                                                    <p className="text-[11px] text-slate-500">Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {assignment.marks != null && (
                                                    <span className="text-lg font-bold text-white">{assignment.marks}<span className="text-slate-500 text-xs font-normal">/{assignment.maxMarks}</span></span>
                                                )}
                                                {assignment.submitted ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Submitted</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                                    <p className="text-sm text-slate-500">No assignments in this batch yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDetailModal;
