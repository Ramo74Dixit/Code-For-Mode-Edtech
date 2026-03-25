import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Video, Calendar, Clock, MonitorPlay, AlertCircle, History, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../services/api';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';

const LiveSchedule = () => {
    const [data, setData] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [playingSession, setPlayingSession] = useState(null);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await api.get('/live-sessions/my/all');
            setData(res.data.data);
        } catch (error) {
            console.error("Failed to fetch live schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (session) => {
        // Extract video ID and play in-app for both live and past sessions
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
            // Fallback only if can't extract video ID
            window.open(session.youtubeLiveUrl, '_blank');
        }
    };

    const EmptyState = ({ type }) => (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                {type === 'upcoming' ? <Video className="h-8 w-8 text-slate-600" /> : <History className="h-8 w-8 text-slate-600" />}
            </div>
            <h3 className="text-xl font-medium text-slate-300">
                {type === 'upcoming' ? "No upcoming classes" : "No past classes found"}
            </h3>
            <p className="text-slate-500 mt-2 max-w-sm">
                {type === 'upcoming' 
                    ? "You're all caught up! Check back later for new sessions." 
                    : "Your attendance history will appear here once you complete classes."}
            </p>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-8 p-8 max-w-5xl mx-auto">
                 <SkeletonLoader type="text" className="w-64 h-12 mb-8" />
                 <div className="space-y-4">
                     <SkeletonLoader type="rectangular" count={3} className="h-40 w-full rounded-2xl" />
                 </div>
            </div>
        );
    }

    const displayedSessions = activeTab === 'upcoming' ? data.upcoming : data.past;

    return (
        <PageTransition className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
            {/* Ambient Background */}
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

                    {/* Glass Tabs */}
                    <div className="flex p-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-full">
                        {['upcoming', 'past'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative
                                    ${activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
                                `}
                            >
                                {activeTab === tab && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-slate-800 rounded-full shadow-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 capitalize flex items-center gap-2">
                                    {tab} 
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                                        {data[tab].length}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {displayedSessions.length > 0 ? (
                            displayedSessions.map((session, index) => (
                                <div 
                                    key={session._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-300"
                                >
                                    {/* Status Indicator */}
                                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl ${activeTab === 'upcoming' ? 'bg-rose-500' : 'bg-slate-700'}`} />

                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Date Box */}
                                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-slate-900/50 rounded-xl border border-slate-800">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {new Date(session.scheduledStartTime).toLocaleDateString([], { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-bold text-white">
                                                {new Date(session.scheduledStartTime).getDate()}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            {activeTab === 'upcoming' && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 mb-1">
                                                    <span className="relative flex h-2 w-2">
                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                    </span>
                                                    Scheduled
                                                </div>
                                            )}

                                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                                                {session.title}
                                            </h3>
                                            
                                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                                <span className="text-indigo-400 font-medium">{session.batch?.name}</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                <span>with {session.trainer?.name}</span>
                                            </p>

                                            <div className="flex items-center gap-6 text-sm text-slate-500 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    {new Date(session.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {session.description && (
                                                    <div className="hidden sm:block truncate max-w-xs " title={session.description}>
                                                        {session.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <Button 
                                                onClick={() => handleJoin(session)}
                                                className={`
                                                    w-full md:w-auto px-6 py-6 text-base font-medium transition-all shadow-lg
                                                    ${activeTab === 'upcoming' 
                                                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' 
                                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'}
                                                `}
                                            >
                                                {activeTab === 'upcoming' ? (
                                                    <>Join Class <Video className="ml-2 h-5 w-5" /></>
                                                ) : (
                                                   <>Watch Recording <MonitorPlay className="ml-2 h-5 w-5" /></>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState type={activeTab} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Cinematic Video Overlay */}
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
                        <div className="aspect-video w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <div className="aspect-video w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 [&_.plyr]:h-full [&_.plyr]:w-full">
                            <Plyr 
                                source={{
                                    type: 'video',
                                    sources: [
                                        {
                                            src: playingSession.videoId,
                                            provider: 'youtube',
                                        },
                                    ],
                                }}
                                options={{
                                    autoplay: true,
                                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
                                    youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 }
                                }}
                            />
                        </div>
                        </div>
                        <div className="mt-6 max-w-4xl text-center">
                            <h3 className="text-white font-medium text-lg">{playingSession.title}</h3>
                            <p className="text-slate-400 text-sm mt-1">Recorded on {new Date(playingSession.scheduledStartTime).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </PageTransition>
    );
};

export default LiveSchedule;
