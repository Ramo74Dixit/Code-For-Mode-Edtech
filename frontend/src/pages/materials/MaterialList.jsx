import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { FolderOpen, ChevronDown, ChevronRight, Users, FileText, Image, Link as LinkIcon, ExternalLink, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const MaterialList = () => {
    const { user } = useAuth();
    const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [batchMaterials, setBatchMaterials] = useState([]);
    const [expandedBatches, setExpandedBatches] = useState({});

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const batchesRes = isTrainer
                ? await api.get('/batches/trainer/my-batches')
                : await api.get('/batches/my/enrollments');

            const batches = batchesRes.data.data || [];

            const results = batches.map(batch => {
                const batchData = batch.batch || batch;
                return {
                    batchId: batchData._id,
                    batchName: batchData.name,
                    courseName: batchData.course?.title || '',
                    resources: batchData.resources || []
                };
            });

            setBatchMaterials(results.filter(r => r.resources.length > 0 || isTrainer));

            if (results.length > 0) {
                setExpandedBatches({ [results[0].batchId]: true });
            }
        } catch (err) {
            console.error('Failed to fetch materials:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleBatch = (batchId) => {
        setExpandedBatches(prev => ({ ...prev, [batchId]: !prev[batchId] }));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText className="h-5 w-5 text-red-400" />;
            case 'image': return <Image className="h-5 w-5 text-blue-400" />;
            case 'video': return <ExternalLink className="h-5 w-5 text-purple-400" />;
            case 'link': return <LinkIcon className="h-5 w-5 text-cyan-400" />;
            default: return <FolderOpen className="h-5 w-5 text-slate-400" />;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'pdf': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'image': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'video': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'link': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
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
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                    <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Study Materials</h1>
                    <p className="text-slate-400">
                        {isTrainer ? 'Resources uploaded across your batches.' : 'Notes, PDFs, and resources shared by your trainers.'}
                    </p>
                </div>
            </div>

            {batchMaterials.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300">No Materials Yet</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                        {isTrainer ? 'Upload materials from the batch management page.' : 'When your trainers upload study materials, they will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {batchMaterials.map(batch => {
                        const isExpanded = expandedBatches[batch.batchId];
                        return (
                            <div key={batch.batchId} className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => toggleBatch(batch.batchId)}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-800/30 transition-colors"
                                >
                                    <Users className="h-5 w-5 text-purple-400" />
                                    <div className="flex-1 text-left">
                                        <h3 className="text-lg font-bold text-white">{batch.batchName}</h3>
                                        <p className="text-xs text-slate-500">{batch.courseName} • {batch.resources.length} resource{batch.resources.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <span className="bg-purple-500/10 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/20">
                                        {batch.resources.length}
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
                                                {batch.resources.length > 0 ? batch.resources.map((resource, idx) => (
                                                    <a
                                                        key={resource._id || idx}
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all group cursor-pointer"
                                                    >
                                                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                                                            {getIcon(resource.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">{resource.title}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase border ${getTypeBadgeColor(resource.type)}`}>
                                                                    {resource.type}
                                                                </span>
                                                                {resource.createdAt && (
                                                                    <span className="text-[10px] text-slate-600">
                                                                        Added {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                                                    </a>
                                                )) : (
                                                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                                                        <FolderOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                                        <p className="text-slate-500 text-sm">No materials in this batch yet.</p>
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

export default MaterialList;
