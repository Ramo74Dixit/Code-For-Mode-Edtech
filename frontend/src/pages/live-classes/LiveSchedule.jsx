import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Video, Calendar, Clock, MonitorPlay, History, Sparkles, ChevronDown, ChevronRight, BookOpen, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';
import ScheduleLiveModal from '../../components/dashboard/trainer/ScheduleLiveModal';

const LiveSchedule = () => {
    const { user } = useAuth();
    const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

    const [data, setData] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [playingSession, setPlayingSession] = useState(null);

    // Trainer-specific state
    const [trainerData, setTrainerData] = useState([]); // grouped by course→batch
    const [expandedCourses, setExpandedCourses] = useState({});
    const [expandedBatches, setExpandedBatches] = useState({});
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

    useEffect(() => {
        if (isTrainer) {
            fetchTrainerData();
        } else {
            fetchStudentData();
        }
    }, []);

    // Student: flat list
    const fetchStudentData = async () => {
        try {
            const res = await api.get('/live-sessions/my/all');
            setData(res.data.data);
        } catch (error) {
            console.error("Failed to fetch live schedule", error);
        } finally {
            setLoading(false);
        }
    };

    // Trainer: grouped by Course → Batch
    const fetchTrainerData = async () => {
        try {
            const batchesRes = await api.get('/batches/trainer/my-batches');
            const batches = batchesRes.data.data || [];

            // Fetch live sessions for each batch in parallel
            const sessionsPromises = batches.map(batch =>
                api.get(`/batches/${batch._id}/live-sessions`)
                    .then(res => ({ batchId: batch._id, sessions: res.data.data }))
                    .catch(() => ({ batchId: batch._id, sessions: { upcoming: [], past: [] } }))
            );
            const sessionsResults = await Promise.all(sessionsPromises);

            // Build sessions map
            const sessionsMap = {};
            sessionsResults.forEach(r => { sessionsMap[r.batchId] = r.sessions; });

            // Group batches by course
            const courseMap = {};
            batches.forEach(batch => {
                const courseId = batch.course?._id || 'unknown';
                const courseTitle = batch.course?.title || 'Untitled Course';
                const courseThumbnail = batch.course?.thumbnail || '';

                if (!courseMap[courseId]) {
                    courseMap[courseId] = { courseId, courseTitle, courseThumbnail, batches: [] };
                }
                courseMap[courseId].batches.push({
                    ...batch,
                    sessions: sessionsMap[batch._id] || { upcoming: [], past: [] }
                });
            });

            const grouped = Object.values(courseMap);
            setTrainerData(grouped);

            // Auto-expand first course
            if (grouped.length > 0) {
                setExpandedCourses({ [grouped[0].courseId]: true });
                if (grouped[0].batches.length > 0) {
                    setExpandedBatches({ [grouped[0].batches[0]._id]: true });
                }
            }
        } catch (error) {
            console.error("Failed to fetch trainer data", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCourse = (courseId) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const toggleBatch = (batchId) => {
        setExpandedBatches(prev => ({ ...prev, [batchId]: !prev[batchId] }));
    };

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this live session?")) return;
        try {
            await api.delete(`/live-sessions/${sessionId}`);
            fetchTrainerData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete session');
        }
    };

    const handleJoin = (session) => {
        let videoId = session.youtubeVideoId;
        if (!videoId && session.recordingUrl) {
            videoId = session.recordingUrl.split('v=')[1]?.split('&')[0] || session.recordingUrl.split('/').pop();
        }
        if (!videoId && session.youtubeLiveUrl) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
            const match = session.youtubeLiveUrl.match(regExp);
            videoId = (match && match[2].length === 11) ? match[2] : null;
            if (!videoId) {
                videoId = session.youtubeLiveUrl.split('v=')[1]?.split('&')[0] || session.youtubeLiveUrl.split('/').pop();
            }
        }
        
        if (videoId) {
            setPlayingSession({ ...session, videoId });
        } else {
            window.open(session.youtubeLiveUrl, '_blank');
        }
    };

    const EmptyState = ({ type }) => (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                {type === 'upcoming' ? <Video className="h-6 w-6 text-slate-600" /> : <History className="h-6 w-6 text-slate-600" />}
            </div>
            <h3 className="text-lg font-medium text-slate-300">
                {type === 'upcoming' ? "No upcoming classes" : "No past recordings"}
            </h3>
            <p className="text-slate-500 mt-1 text-sm max-w-sm">
                {type === 'upcoming' ? "No sessions scheduled yet." : "Past recordings will appear here."}
            </p>
        </div>
    );

    // Session card for both trainer & student
    const SessionCard = ({ session, type, showDelete = false }) => (
        <div className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-300">
            <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-2xl ${type === 'upcoming' ? 'bg-rose-500' : 'bg-slate-700'}`} />

            {showDelete && (
                <button
                    onClick={(e) => handleDeleteSession(e, session._id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-rose-500/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-900/50 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {new Date(session.scheduledStartTime).toLocaleDateString([], { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-white">
                        {new Date(session.scheduledStartTime).getDate()}
                    </span>
                </div>

                <div className="flex-1 space-y-1">
                    {type === 'upcoming' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 mb-1">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                            </span>
                            Scheduled
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{session.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(session.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {session.batch?.name && (
                            <span className="text-indigo-400 text-xs font-medium">{session.batch.name}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center">
                    <Button 
                        onClick={() => handleJoin(session)}
                        size="sm"
                        className={`px-5 ${type === 'upcoming' 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        {type === 'upcoming' ? 'Join' : 'Watch'}
                        {type === 'upcoming' ? <Video className="ml-2 h-4 w-4" /> : <MonitorPlay className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-8 p-8 max-w-5xl mx-auto">
                <SkeletonLoader type="text" className="w-64 h-12 mb-8" />
                <SkeletonLoader type="rectangular" count={3} className="h-32 w-full rounded-2xl" />
            </div>
        );
    }

    // ─── TRAINER VIEW: Course → Batch hierarchy ─────────
    if (isTrainer) {
        return (
            <PageTransition className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <MonitorPlay className="h-8 w-8 text-rose-500" />
                                Live <span className="text-rose-500">Studios</span>
                            </h1>
                            <p className="text-slate-400 text-lg">Manage sessions across all your courses & batches.</p>
                        </div>
                        <Button onClick={() => setIsLiveModalOpen(true)} className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 gap-2">
                            <Plus className="h-4 w-4" /> Schedule Live Class
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full w-fit">
                        {['upcoming', 'past'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative capitalize
                                    ${activeTab === tab ? 'text-white bg-slate-800 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Course → Batch Hierarchy */}
                    {trainerData.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                            <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No courses with batches found. Create a batch to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {trainerData.map(course => {
                                const isExpanded = expandedCourses[course.courseId];
                                // Count total sessions for this tab across all batches
                                const totalSessions = course.batches.reduce((sum, b) => 
                                    sum + (b.sessions[activeTab]?.length || 0), 0);

                                return (
                                    <div key={course.courseId} className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                                        {/* Course Header */}
                                        <button
                                            onClick={() => toggleCourse(course.courseId)}
                                            className="w-full flex items-center gap-4 p-5 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <div className="h-12 w-12 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0">
                                                {course.courseThumbnail ? (
                                                    <img src={course.courseThumbnail} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen className="h-5 w-5 text-slate-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="text-lg font-bold text-white">{course.courseTitle}</h3>
                                                <p className="text-xs text-slate-500">{course.batches.length} batch{course.batches.length !== 1 ? 'es' : ''} • {totalSessions} {activeTab} session{totalSessions !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-indigo-500/10 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/20">
                                                    {totalSessions}
                                                </span>
                                                {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                            </div>
                                        </button>

                                        {/* Batches inside course */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-slate-800/50"
                                                >
                                                    <div className="p-4 space-y-3">
                                                        {course.batches.map(batch => {
                                                            const isBatchExpanded = expandedBatches[batch._id];
                                                            const sessions = batch.sessions[activeTab] || [];

                                                            return (
                                                                <div key={batch._id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
                                                                    {/* Batch Header */}
                                                                    <button
                                                                        onClick={() => toggleBatch(batch._id)}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                                                    >
                                                                        <Users className="h-4 w-4 text-emerald-400" />
                                                                        <span className="text-sm font-semibold text-white flex-1 text-left">{batch.name}</span>
                                                                        <span className="text-xs text-slate-500">{batch.currentEnrollment || 0} students</span>
                                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sessions.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                                            {sessions.length}
                                                                        </span>
                                                                        {isBatchExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                                                                    </button>

                                                                    {/* Sessions inside batch */}
                                                                    <AnimatePresence>
                                                                        {isBatchExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="px-4 pb-4 space-y-3">
                                                                                    {sessions.length > 0 ? (
                                                                                        sessions.map(session => (
                                                                                            <SessionCard
                                                                                                key={session._id}
                                                                                                session={session}
                                                                                                type={activeTab}
                                                                                                showDelete={true}
                                                                                            />
                                                                                        ))
                                                                                    ) : (
                                                                                        <EmptyState type={activeTab} />
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            );
                                                        })}
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

                {/* Video Player Overlay */}
                {playingSession && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/50">
                            <h2 className="text-xl font-medium text-white flex items-center gap-3">
                                <MonitorPlay className="h-6 w-6 text-rose-500" />
                                {playingSession.title}
                            </h2>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setPlayingSession(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </Button>
                        </div>
                        <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-10 overflow-y-auto">
                            <div className="aspect-video w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 [&_.plyr]:h-full [&_.plyr]:w-full">
                                <Plyr 
                                    source={{ type: 'video', sources: [{ src: playingSession.videoId, provider: 'youtube' }] }}
                                    options={{ autoplay: true, controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'], youtube: { noCookie: true, rel: 0, showinfo: 0 } }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <ScheduleLiveModal isOpen={isLiveModalOpen} onClose={() => setIsLiveModalOpen(false)} onSessionScheduled={() => fetchTrainerData()} />
            </PageTransition>
        );
    }

    // ─── STUDENT VIEW: Flat list (original) ─────────
    const displayedSessions = activeTab === 'upcoming' ? data.upcoming : data.past;

    return (
        <PageTransition className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <MonitorPlay className="h-8 w-8 text-rose-500" />
                            Live <span className="text-rose-500">Studios</span>
                        </h1>
                        <p className="text-slate-400 text-lg">Your interactive learning schedule.</p>
                    </div>
                    <div className="flex p-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full">
                        {['upcoming', 'past'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize
                                    ${activeTab === tab ? 'text-white bg-slate-800 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {tab} <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>{data[tab].length}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {displayedSessions.length > 0 ? (
                        displayedSessions.map(session => (
                            <SessionCard key={session._id} session={session} type={activeTab} />
                        ))
                    ) : (
                        <EmptyState type={activeTab} />
                    )}
                </div>
            </div>

            {playingSession && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/50">
                        <h2 className="text-xl font-medium text-white flex items-center gap-3">
                            <MonitorPlay className="h-6 w-6 text-rose-500" />
                            {playingSession.title}
                        </h2>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setPlayingSession(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </Button>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-10 overflow-y-auto">
                        <div className="aspect-video w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 [&_.plyr]:h-full [&_.plyr]:w-full">
                            <Plyr 
                                source={{ type: 'video', sources: [{ src: playingSession.videoId, provider: 'youtube' }] }}
                                options={{ autoplay: true, controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'], youtube: { noCookie: true, rel: 0, showinfo: 0 } }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
};

export default LiveSchedule;
