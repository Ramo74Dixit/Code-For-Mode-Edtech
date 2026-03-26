import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Calendar, CheckCircle, Clock, FileText, ChevronDown, ChevronRight, BookOpen, Users, Download, ExternalLink, Paperclip } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AssignmentList = () => {
    const { user } = useAuth();
    const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [batchAssignments, setBatchAssignments] = useState([]);
    const [expandedBatches, setExpandedBatches] = useState({});

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            // Get enrolled batches for students, trainer batches for trainers
            const batchesRes = isTrainer
                ? await api.get('/batches/trainer/my-batches')
                : await api.get('/batches/my/enrollments');

            const batches = batchesRes.data.data || [];

            // Fetch assignments per batch
            const results = await Promise.all(
                batches.map(async (batch) => {
                    const batchId = batch.batch?._id || batch._id;
                    const batchName = batch.batch?.name || batch.name;
                    const courseName = batch.batch?.course?.title || batch.course?.title || '';
                    try {
                        const res = await api.get(`/assignments/batch/${batchId}`);
                        return {
                            batchId,
                            batchName,
                            courseName,
                            assignments: res.data.data || []
                        };
                    } catch {
                        return { batchId, batchName, courseName, assignments: [] };
                    }
                })
            );

            setBatchAssignments(results.filter(r => r.assignments.length > 0 || isTrainer));

            // Auto-expand first batch
            if (results.length > 0) {
                setExpandedBatches({ [results[0].batchId]: true });
            }
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleBatch = (batchId) => {
        setExpandedBatches(prev => ({ ...prev, [batchId]: !prev[batchId] }));
    };

    const getStatusColor = (assignment) => {
        const now = new Date();
        const due = new Date(assignment.dueDate);
        if (assignment.status === 'closed' || assignment.status === 'graded') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (due < now) return 'bg-red-500/10 text-red-400 border-red-500/20';
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    };

    const getStatusText = (assignment) => {
        const now = new Date();
        const due = new Date(assignment.dueDate);
        if (assignment.status === 'graded') return 'Graded';
        if (assignment.status === 'closed') return 'Closed';
        if (due < now) return 'Overdue';
        return 'Active';
    };

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
                <div className="h-8 bg-slate-800/50 rounded w-1/3 animate-pulse mb-6"></div>
                {[1,2,3].map(i => (
                    <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Assignments</h1>
                    <p className="text-slate-400">
                        {isTrainer ? 'View all assignments across your batches.' : 'Your pending and submitted assignments.'}
                    </p>
                </div>
            </div>

            {batchAssignments.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300">No Assignments Yet</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                        {isTrainer ? 'Create assignments from the batch management page.' : 'When your trainers post assignments, they will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {batchAssignments.map(batch => {
                        const isExpanded = expandedBatches[batch.batchId];
                        return (
                            <div key={batch.batchId} className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => toggleBatch(batch.batchId)}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-800/30 transition-colors"
                                >
                                    <Users className="h-5 w-5 text-indigo-400" />
                                    <div className="flex-1 text-left">
                                        <h3 className="text-lg font-bold text-white">{batch.batchName}</h3>
                                        <p className="text-xs text-slate-500">{batch.courseName} • {batch.assignments.length} assignment{batch.assignments.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <span className="bg-blue-500/10 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">
                                        {batch.assignments.length}
                                    </span>
                                    {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-slate-800/50"
                                        >
                                            <div className="p-4 space-y-3">
                                                {batch.assignments.length > 0 ? batch.assignments.map(assignment => (
                                                    <Card key={assignment._id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all group">
                                                        <CardContent className="p-5">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{assignment.title}</h4>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment)}`}>
                                                                            {getStatusText(assignment)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-slate-400 line-clamp-2">{assignment.description}</p>
                                                                </div>

                                                                <div className="flex items-center gap-6 text-sm text-slate-500">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar className="h-4 w-4" />
                                                                        <span>Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-bold text-white">{assignment.maxMarks}</span>
                                                                        <span>marks</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {assignment.attachments?.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/50">
                                                                    {assignment.attachments.map((file, idx) => (
                                                                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                                                           className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-300 transition-colors">
                                                                            <Paperclip className="h-3 w-3" />
                                                                            {file.name || 'Attachment'}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                )) : (
                                                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                                                        <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                                        <p className="text-slate-500 text-sm">No assignments in this batch yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AssignmentList;
