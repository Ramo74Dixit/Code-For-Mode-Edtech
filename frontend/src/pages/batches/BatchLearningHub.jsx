import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import SubmissionListModal from '../../components/dashboard/trainer/SubmissionListModal';
import CreateAssignmentModal from '../../components/dashboard/trainer/CreateAssignmentModal';
import CreateTestModal from '../../components/dashboard/trainer/CreateTestModal';
import CreateAnnouncementModal from '../../components/dashboard/trainer/CreateAnnouncementModal';
import { Video, Calendar, FileText, Download, Link as LinkIcon, Users, ArrowLeft, PlayCircle, X, BookOpen, Code, Trophy, Sparkles, Megaphone, Bell, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';

const BatchLearningHub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('lectures'); 
  const [batch, setBatch] = useState(null);
  const [liveSessions, setLiveSessions] = useState({ upcoming: [], past: [] });
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]); 
  const [loading, setLoading] = useState(true);

  // UI States
  const [playingVideo, setPlayingVideo] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false); 
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false); 

  // Stats
  const [stats, setStats] = useState({
      upcomingClasses: 0,
      activeAssignments: 0,
      resourcesCount: 0,
      activeTests: 0,
      announcementsCount: 0
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [batchRes, liveRes, assignRes, testRes] = await Promise.all([
          api.get(`/batches/${id}`),
          api.get(`/batches/${id}/live-sessions`),
          api.get(`/batches/${id}/assignments`),
          api.get(`/tests/batch/${id}`) 
      ]);

      setBatch(batchRes.data.data);
      setLiveSessions(liveRes.data.data);
      setAssignments(assignRes.data.data);
      setTests(testRes.data.data);
      
      setStats({
          upcomingClasses: liveRes.data.data.upcoming.length,
          activeAssignments: assignRes.data.data.length,
          resourcesCount: batchRes.data.data.resources?.length || 0,
          activeTests: testRes.data.data.length,
          announcementsCount: batchRes.data.data.announcements?.length || 0
      });

    } catch (error) {
      console.error('Failed to fetch classroom data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = (session) => {
      // Play live stream in-app instead of redirecting to YouTube
      const videoId = getVideoId(session.youtubeLiveUrl);
      if (videoId) {
          setPlayingVideo({ ...session, youtubeId: videoId, isLiveSession: true });
      } else {
          // Fallback: if can't extract ID, open in new tab
          window.open(session.youtubeLiveUrl, '_blank');
      }
  };

  const getVideoId = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleDeleteRecording = async (e, sessionId) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this recording?")) return;
      try {
          await api.delete(`/live-sessions/${sessionId}`);
          alert("Recording deleted successfully");
          fetchData();
      } catch (error) {
          console.error("Delete error", error);
          alert(error.response?.data?.message || 'Failed to delete recording');
      }
  };

  const handleAssignmentSubmit = async (e) => {
      e.preventDefault();
      try {
          let fileUrl = '';
          
          if (submissionFile) {
              const formData = new FormData();
              formData.append('resource', submissionFile); 
              const uploadRes = await api.post('/upload/resource', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
              });
              fileUrl = uploadRes.data.data;
          }

          await api.post(`/assignments/${selectedAssignment._id}/submit`, { 
              submissionLink,
              fileUrl 
          });

          alert("Assignment Submitted Successfully!");
          setSelectedAssignment(null);
          setSubmissionLink('');
          setSubmissionFile(null);
          fetchData(); 
      } catch (error) {
          console.error("Submission error", error);
          alert(error.response?.data?.message || 'Failed to submit assignment');
      }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans selection:bg-indigo-500/30">
        
        {/* Dynamic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-8">
                 <Button 
                    variant="ghost" 
                    className="gap-2 text-slate-400 hover:text-white hover:bg-white/5" 
                    onClick={() => navigate('/batches')}
                 >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Batches
                 </Button>
                 {user.role === 'trainer' && (
                     <div className="text-xs font-mono text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20">
                         Trainer View
                     </div>
                 )}
            </div>

            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900/50 via-slate-900/80 to-slate-900 border border-white/10 shadow-2xl mb-12">
                 <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:30px_30px]" />
                 <div className="relative p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                     <div>
                         <div className="flex items-center gap-3 mb-4">
                             <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                 {batch?.enrollmentType === 'open' ? 'Premium Batch' : 'Private Cohort'}
                             </span>
                             <span className="flex items-center gap-1 text-xs text-emerald-400">
                                 <span className="relative flex h-2 w-2">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                 </span>
                                 Active Now
                             </span>
                         </div>
                         <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                             {batch?.name}
                         </h1>
                         <p className="text-slate-400 text-lg max-w-2xl">
                             Master {batch?.course?.title} with real-time mentorship and hands-on projects.
                         </p>
                     </div>

                     {/* Stats Pills */}
                     <div className="flex gap-3 flex-wrap">
                         <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[100px] hover:bg-white/5 transition-colors">
                             <span className="text-2xl font-bold text-indigo-400">{stats.upcomingClasses}</span>
                             <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Live</span>
                         </div>
                         <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[100px] hover:bg-white/5 transition-colors">
                             <span className="text-2xl font-bold text-violet-400">{stats.activeAssignments}</span>
                             <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Tasks</span>
                         </div>
                         <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[100px] hover:bg-white/5 transition-colors">
                             <span className="text-2xl font-bold text-emerald-400">{stats.activeTests}</span>
                             <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Tests</span>
                         </div>
                         <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[100px] hover:bg-white/5 transition-colors">
                             <span className="text-2xl font-bold text-amber-500">{stats.announcementsCount}</span>
                             <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Notices</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Floating Navigation Tabs */}
            <div className="sticky top-4 z-40 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex gap-1 overflow-x-auto mb-10 shadow-lg shadow-black/50">
                {[
                    { id: 'lectures', icon: Calendar, label: 'Live & Rec' },
                    { id: 'announcements', icon: Megaphone, label: 'Announcements' },
                    { id: 'videos', icon: PlayCircle, label: 'Modules' },
                    { id: 'assignments', icon: Trophy, label: 'Challenges' },
                    { id: 'resources', icon: Download, label: 'Resources' },
                    { id: 'tests', icon: Code, label: 'Test Arena' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-100' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area with smooth fade */}
            <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* LIVE CLASSES TAB */}
                {activeTab === 'lectures' && (
                    <div className="space-y-12">
                        {/* Upcoming */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <span className="bg-rose-500/20 text-rose-400 p-2 rounded-lg"><Video className="h-6 w-6" /></span>
                                    Upcoming Sessions
                                </h2>
                            </div>
                            
                            {liveSessions.upcoming.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {liveSessions.upcoming.map(session => (
                                        <Card key={session._id} className="bg-slate-900/50 border-slate-800 text-slate-100 backdrop-blur-sm hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:shadow-xl transition-all duration-300 group">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-rose-500/20 animate-pulse">Live Soon</span>
                                                    <span className="text-slate-400 text-sm font-mono">{new Date(session.scheduledStartTime).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{session.title}</h3>
                                                <p className="text-slate-400 text-sm mb-6 line-clamp-2">{session.description}</p>
                                                
                                                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                                    <div className="text-sm font-medium text-slate-300">
                                                        ⏰ {new Date(session.scheduledStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </div>
                                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20" onClick={() => handleJoinClass(session)}>
                                                        Join Now
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                                    <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No upcoming sessions. Time to relax! ☕</p>
                                </div>
                            )}
                        </section>

                        {/* Past Recordings */}
                        <section>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                                <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg"><PlayCircle className="h-6 w-6" /></span>
                                Past Recordings
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {liveSessions.past.map(session => {
                                    const videoId = getVideoId(session.youtubeLiveUrl);
                                    return (
                                        <div 
                                            key={session._id} 
                                            onClick={() => setPlayingVideo({ ...session, youtubeId: videoId, isLiveRecording: true })}
                                            className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
                                        >
                                            {user.role === 'trainer' && (
                                                <button
                                                    onClick={(e) => handleDeleteRecording(e, session._id)}
                                                    className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-rose-500/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"
                                                    title="Delete Recording"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            <div className="aspect-video relative overflow-hidden">
                                                <img 
                                                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                    alt={session.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="h-14 w-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/50">
                                                        <PlayCircle className="h-8 w-8 text-white fill-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">{session.title}</h3>
                                                <p className="text-xs text-slate-500">{new Date(session.scheduledStartTime).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {/* ANNOUNCEMENTS TAB */}
                {activeTab === 'announcements' && (
                     <div className="space-y-6">
                         {user.role === 'trainer' && (
                            <div className="flex justify-end">
                                <Button onClick={() => setShowCreateAnnouncementModal(true)} className="bg-amber-600 hover:bg-amber-500 text-white">
                                    <Megaphone className="mr-2 h-4 w-4" /> Post Announcement
                                </Button>
                            </div>
                         )}

                         <div className="grid gap-4">
                            {batch?.announcements?.length > 0 ? (
                                batch.announcements.map((ann) => (
                                    <div key={ann._id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all flex gap-4">
                                        <div className="shrink-0">
                                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                                <Bell className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-lg text-white">{ann.title}</h3>
                                                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                                    <Megaphone className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-400">Quiet on set!</h3>
                                    <p className="text-slate-500 mt-2">No announcements posted yet.</p>
                                </div>
                            )}
                         </div>
                     </div>
                )}

                {/* VIDEOS TAB */}
                {activeTab === 'videos' && (
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         {batch?.videos?.map(video => (
                             <div 
                                key={video._id} 
                                onClick={() => setPlayingVideo({ ...video, isCourseVideo: true })}
                                className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img 
                                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur px-2 py-1 rounded text-xs font-mono text-white">
                                        {video.duration}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="h-14 w-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/50">
                                            <PlayCircle className="h-8 w-8 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-white line-clamp-1 mb-2 group-hover:text-indigo-400 transition-colors">{video.title}</h3>
                                    <p className="text-sm text-slate-400 line-clamp-2">{video.description}</p>
                                </div>
                            </div>
                         ))}
                     </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="space-y-6">
                         {user.role === 'trainer' && (
                            <div className="flex justify-end">
                                <Button onClick={() => setShowCreateAssignmentModal(true)} className="bg-indigo-600 hover:bg-indigo-500">
                                    + New Challenge
                                </Button>
                            </div>
                         )}

                         {assignments.length > 0 ? assignments.map(assign => (
                             <Card key={assign._id} className="bg-slate-900/50 border-slate-800 text-slate-100 group hover:border-indigo-500/50 transition-all">
                                 <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                                     <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                                         <Trophy className="h-8 w-8" />
                                     </div>
                                     <div className="flex-1 text-center md:text-left">
                                         <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">{assign.title}</h3>
                                         <p className="text-slate-400 mt-2 line-clamp-2">{assign.description}</p>
                                     </div>
                                     <div className="flex flex-col items-end gap-2 text-sm text-slate-500 font-mono">
                                         <span>Deadline: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                         <span>Points: {assign.maxMarks} XP</span>
                                     </div>
                                     <div className="flex gap-2 w-full md:w-auto">
                                         <Button className="flex-1 md:flex-none border-slate-700 hover:bg-slate-800" variant="outline" onClick={() => setSelectedAssignment(assign)}>
                                             View Details
                                         </Button>
                                     </div>
                                 </CardContent>
                             </Card>
                         )) : (
                             <div className="text-center py-20">
                                 <p className="text-slate-500">No active challenges. You are unstoppable! 🚀</p>
                             </div>
                         )}
                    </div>
                )}
                
                {/* RESOURCES TAB */}
                {activeTab === 'resources' && (
                     <div className="grid md:grid-cols-2 gap-4">
                         {batch?.resources?.map((res, i) => (
                             <div key={i} className="flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/40 hover:bg-slate-800/50 transition-all group">
                                 <div className="flex items-center gap-4">
                                     <div className="h-12 w-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                         {res.type === 'pdf' ? <FileText className="h-6 w-6" /> : <LinkIcon className="h-6 w-6" />}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{res.title}</h4>
                                         <p className="text-xs text-slate-500">Shared on {new Date(res.createdAt).toLocaleDateString()}</p>
                                     </div>
                                 </div>
                                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => window.open(res.url, '_blank')}>
                                     <Download className="h-5 w-5" />
                                 </Button>
                             </div>
                         ))}
                     </div>
                )}

                {/* TESTS TAB */}
                {activeTab === 'tests' && (
                    <div className="space-y-6">
                        {user.role === 'trainer' && (
                            <div className="flex justify-end">
                                <Button onClick={() => setShowCreateTestModal(true)} className="bg-emerald-600 hover:bg-emerald-500">
                                    + New Assessment
                                </Button>
                            </div>
                        )}
                        {tests.map(test => (
                             <Card key={test._id} className="bg-slate-900/50 border-slate-800 text-slate-100 group hover:border-emerald-500/50 transition-all">
                                 <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                                     <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                         <Code className="h-8 w-8" />
                                     </div>
                                     <div className="flex-1">
                                         <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{test.title}</h3>
                                         <div className="flex gap-4 mt-2 text-xs font-mono text-emerald-300/80">
                                             <span className="bg-emerald-500/10 px-2 py-1 rounded">⏱️ {test.duration} mins</span>
                                             <span className="bg-emerald-500/10 px-2 py-1 rounded">🧩 {test.questions.length} Questions</span>
                                         </div>
                                     </div>
                                     <Button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => window.open(`/tests/${test._id}/start`, '_blank')}>
                                         Enter Arena
                                     </Button>
                                 </CardContent>
                             </Card>
                        ))}
                    </div>
                )}

            </div>
        </div>

        {/* Video Player Overlay (Theater Mode) */}
        {playingVideo && (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                 <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="font-bold text-lg text-white">{playingVideo.title}</h2>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setPlayingVideo(null)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                     <div className="flex-1 flex items-center justify-center bg-black p-4 md:p-10 text-white">
                         <div className="aspect-video w-full max-w-6xl shadow-2xl shadow-indigo-500/20 rounded-xl overflow-hidden border border-white/10 [&_.plyr]:h-full [&_.plyr]:w-full">
                             <Plyr 
                                source={{
                                    type: 'video',
                                    sources: [
                                        {
                                            src: playingVideo.youtubeId || getVideoId(playingVideo.youtubeLiveUrl),
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
                    {/* Sidebar for Course Videos */}
                    {playingVideo.isCourseVideo && (
                         <div className="w-full md:w-80 border-l border-white/10 bg-slate-900 overflow-y-auto">
                             <div className="p-4 border-b border-white/10">
                                 <h3 className="font-bold text-white">Course Content</h3>
                             </div>
                             {batch?.videos?.map(video => (
                                 <div 
                                    key={video._id}
                                    onClick={() => setPlayingVideo({ ...video, isCourseVideo: true })}
                                    className={`p-4 flex gap-3 cursor-pointer hover:bg-white/5 border-b border-white/5 transition-colors ${playingVideo._id === video._id ? 'bg-indigo-600/20 border-l-4 border-l-indigo-500' : ''}`}
                                 >
                                     <img src={`https://img.youtube.com/vi/${video.youtubeId}/default.jpg`} className="w-24 h-16 object-cover rounded" />
                                     <div>
                                         <h4 className={`text-sm font-medium line-clamp-2 ${playingVideo._id === video._id ? 'text-indigo-400' : 'text-slate-300'}`}>{video.title}</h4>
                                         <span className="text-xs text-slate-500">{video.duration}</span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    )}
                </div>
            </div>
        )}

        {/* Keeping existing modals logic */}
        {selectedAssignment && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-white">Assignment Details</h2>
                        <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setSelectedAssignment(null)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    {/* ... (Keep existing form logic with updated styles) ... */}
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">{selectedAssignment.title}</h3>
                             <p className="text-slate-400 whitespace-pre-wrap">{selectedAssignment.description}</p>
                        </div>
                        <form onSubmit={handleAssignmentSubmit} className="space-y-4 pt-4 border-t border-slate-700">
                             <div className="space-y-2">
                                 <label className="text-sm font-medium text-slate-300">Project Link</label>
                                 <input 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://github.com/..." 
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                 />
                             </div>
                             <div className="flex justify-end gap-3 pt-4">
                                 <Button type="button" variant="ghost" className="text-slate-400" onClick={() => setSelectedAssignment(null)}>Cancel</Button>
                                 <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">Submit Assignment</Button>
                             </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {showCreateAssignmentModal && (
            <CreateAssignmentModal 
                batchId={id} 
                onClose={() => setShowCreateAssignmentModal(false)} 
                onSuccess={fetchData} 
            />
        )}

        {showCreateTestModal && (
            <CreateTestModal 
                batchId={id} 
                onClose={() => setShowCreateTestModal(false)} 
                onSuccess={fetchData} 
            />
        )}
        
        {showCreateAnnouncementModal && (
            <CreateAnnouncementModal 
                batchId={id} 
                isOpen={showCreateAnnouncementModal}
                onClose={() => setShowCreateAnnouncementModal(false)} 
                onAnnouncementCreated={fetchData} 
            />
        )}

    </div>
  );
};

export default BatchLearningHub;
