import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Video, Calendar, FileText, Download, Link as LinkIcon, Users, ArrowLeft, PlayCircle, X, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const BatchLearningHub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('lectures'); // lectures (live + videos), assignments, resources
  const [batch, setBatch] = useState(null);
  const [liveSessions, setLiveSessions] = useState({ upcoming: [], past: [] });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [playingVideo, setPlayingVideo] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');

  // Stats
  const [stats, setStats] = useState({
      upcomingClasses: 0,
      activeAssignments: 0,
      resourcesCount: 0
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [batchRes, liveRes, assignRes] = await Promise.all([
          api.get(`/batches/${id}`),
          api.get(`/batches/${id}/live-sessions`),
          api.get(`/batches/${id}/assignments`)
      ]);

      setBatch(batchRes.data.data);
      setLiveSessions(liveRes.data.data);
      setAssignments(assignRes.data.data);
      
      setStats({
          upcomingClasses: liveRes.data.data.upcoming.length,
          activeAssignments: assignRes.data.data.length,
          resourcesCount: batchRes.data.data.resources?.length || 0
      });

    } catch (error) {
      console.error('Failed to fetch classroom data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = (url) => {
      window.open(url, '_blank');
  };

  const getVideoId = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAssignmentSubmit = async (e) => {
      e.preventDefault();
      try {
          // Placeholder for submission logic
          // await api.post(`/assignments/${selectedAssignment._id}/submit`, { link: submissionLink });
          alert("Submission Successful! (Mock)");
          setSelectedAssignment(null);
          setSubmissionLink('');
      } catch (error) {
          alert('Failed to submit assignment');
      }
  };

  if (loading) return <div className="p-10 flex justify-center">Loading Classroom...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4">
             <Button variant="ghost" className="w-fit pl-0 gap-2" onClick={() => navigate('/batches')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Batches
             </Button>

            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-10 text-white shadow-xl">
                 <h1 className="text-3xl font-bold mb-2">{batch?.name}</h1>
                 <p className="text-indigo-100 text-lg mb-6">{batch?.course?.title}</p>
                 
                 <div className="flex flex-wrap gap-4 md:gap-8">
                     <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
                         <Video className="h-5 w-5 text-indigo-200" />
                         <span className="font-semibold">{stats.upcomingClasses} Upcoming Classes</span>
                     </div>
                     <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
                         <FileText className="h-5 w-5 text-indigo-200" />
                         <span className="font-semibold">{stats.activeAssignments} Assignments</span>
                     </div>
                 </div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b overflow-x-auto">
            <button 
                onClick={() => setActiveTab('live')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'live' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
                Live Classes
            </button>
            <button 
                onClick={() => setActiveTab('videos')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'videos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
                Course Videos
            </button>
            <button 
                onClick={() => setActiveTab('assignments')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
                Assignments
            </button>
            <button 
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'resources' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
                Study Materials
            </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
            {activeTab === 'live' && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-300">
                    
                    {/* Upcoming Live Classes */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Upcoming Live Sessions
                        </h2>
                        {liveSessions.upcoming.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {liveSessions.upcoming.map(session => (
                                    <Card key={session._id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                                    Live
                                                </div>
                                                <span className="text-xs text-muted-foreground">{new Date(session.scheduledStartTime).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-2 line-clamp-1">{session.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{session.description}</p>
                                            
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="text-sm font-medium">
                                                    {new Date(session.scheduledStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                                <Button size="sm" onClick={() => handleJoinClass(session.youtubeLiveUrl)}>
                                                    Join Class
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                             <p className="text-muted-foreground text-sm italic">No upcoming sessions scheduled.</p>
                        )}
                    </div>

                    {/* Past Recordings */}
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Video className="h-5 w-5 text-red-500" />
                            Live Class Recordings
                        </h2>
                        {liveSessions.past.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                 {liveSessions.past.map(session => {
                                     const videoId = getVideoId(session.youtubeLiveUrl);
                                     return (
                                        <Card key={session._id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setPlayingVideo({ ...session, youtubeId: videoId, isLiveRecording: true })}>
                                            <CardContent className="p-0">
                                                <div className="aspect-video bg-black relative">
                                                    <img 
                                                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                        alt={session.title}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <PlayCircle className="h-12 w-12 text-white/80 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-base line-clamp-1 mb-1">{session.title}</h3>
                                                    <p className="text-xs text-muted-foreground">{new Date(session.scheduledStartTime).toLocaleDateString()}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                     );
                                 })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No past recordings available.</p>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'videos' && (
                 <div className="animate-in fade-in zoom-in-95 duration-300">
                     <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                            Course Modules & Videos
                        </h2>
                        {batch?.videos?.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {batch.videos.map(video => (
                                    <Card key={video._id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setPlayingVideo({ ...video, isCourseVideo: true })}>
                                        <CardContent className="p-0">
                                            <div className="aspect-video bg-black relative">
                                                <img 
                                                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <PlayCircle className="h-12 w-12 text-white/80 group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                    {video.duration}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-base line-clamp-1 mb-1">{video.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No additional videos uploaded.</p>
                        )}
                 </div>
            )}

            {activeTab === 'assignments' && (
                <div className="grid gap-4 animate-in fade-in zoom-in-95 duration-300">
                     {assignments.length > 0 ? (
                         assignments.map(assign => (
                             <Card key={assign._id} className="hover:border-primary/50 transition-colors">
                                 <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                     <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                         <FileText className="h-6 w-6" />
                                     </div>
                                     <div className="flex-1">
                                         <h3 className="text-lg font-bold">{assign.title}</h3>
                                         <p className="text-muted-foreground text-sm mt-1">{assign.description}</p>
                                         <div className="flex gap-4 mt-3 text-sm">
                                             <span className="font-medium text-red-500">Due: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                             <span className="text-muted-foreground">Marks: {assign.maxMarks}</span>
                                         </div>
                                     </div>
                                     <div className="w-full md:w-auto">
                                         <Button className="w-full md:w-auto" onClick={() => setSelectedAssignment(assign)}>
                                             View & Submit
                                         </Button>
                                     </div>
                                 </CardContent>
                             </Card>
                         ))
                     ) : (
                         <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                            <h3 className="font-medium">No Assignments</h3>
                            <p className="text-muted-foreground text-sm">Great job! You're all caught up.</p>
                        </div>
                     )}
                </div>
            )}

            {activeTab === 'resources' && (
                 <div className="animate-in fade-in zoom-in-95 duration-300">
                     <div className="grid gap-3">
                         {batch?.resources?.length > 0 ? (
                             batch.resources.map((res, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group bg-card">
                                     <div className="flex items-center gap-4">
                                         <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                             {res.type === 'pdf' ? <FileText className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                                         </div>
                                         <div>
                                             <h4 className="font-medium">{res.title}</h4>
                                             <p className="text-xs text-muted-foreground">Added {new Date(res.createdAt).toLocaleDateString()}</p>
                                         </div>
                                     </div>
                                     <Button variant="ghost" size="sm" onClick={() => window.open(res.url, '_blank')}>
                                         <Download className="h-4 w-4" />
                                     </Button>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                                <Download className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                <h3 className="font-medium">No Resources Yet</h3>
                                <p className="text-muted-foreground text-sm">Trainer hasn't uploaded any materials yet.</p>
                            </div>
                         )}
                     </div>
                 </div>
            )}
        </div>

        {/* Video Player Modal/Overlay */}
        {playingVideo && (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
                {/* Header / Top Bar */}
                 <div className="flex items-center justify-between p-4 border-b bg-card z-10 shrink-0">
                    <h2 className="font-bold text-lg line-clamp-1">{playingVideo.title}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setPlayingVideo(null)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                     {/* Left: Player */}
                     <div className="flex-1 flex flex-col min-w-0 bg-black">
                         <div className="flex-1 flex items-center justify-center">
                             <div className="aspect-video w-full max-h-full">
                                 <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={`https://www.youtube.com/embed/${playingVideo.youtubeId || getVideoId(playingVideo.youtubeLiveUrl)}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`} 
                                    title={playingVideo.title} 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    sandbox="allow-scripts allow-same-origin allow-presentation"
                                    allowFullScreen
                                ></iframe>
                             </div>
                        </div>
                        {/* Description Section - Collapsible or small scroll area if needed, but for theater mode usually kept minimal or below */}
                        <div className="p-4 bg-background border-t max-h-[200px] overflow-y-auto hidden md:block">
                             <h3 className="font-bold text-xl mb-1">{playingVideo.title}</h3>
                             <p className="text-muted-foreground whitespace-pre-wrap text-sm">{playingVideo.description}</p>
                        </div>
                     </div>

                     {/* Right: Sidebar Playlist (Only for Course Videos) */}
                     {playingVideo.isCourseVideo && batch?.videos?.length > 0 && (
                         <div className="w-full md:w-96 border-l bg-background flex flex-col h-full shrink-0">
                             <div className="p-4 border-b bg-muted/30">
                                 <h4 className="font-semibold text-sm uppercase tracking-wider">Course Playlist</h4>
                             </div>
                             <div className="flex-1 overflow-y-auto p-0">
                                 {batch.videos.map((video, index) => (
                                     <div 
                                        key={video._id} 
                                        onClick={() => setPlayingVideo({ ...video, isCourseVideo: true })}
                                        className={`flex gap-3 p-4 border-b cursor-pointer transition-colors group ${
                                            playingVideo._id === video._id 
                                            ? 'bg-primary/5' 
                                            : 'hover:bg-muted/50'
                                        }`}
                                     >
                                        <div className="relative w-32 h-20 bg-black rounded-md overflow-hidden shrink-0">
                                            <img 
                                                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                                                alt={video.title}
                                                className="object-cover w-full h-full opacity-80"
                                            />
                                            {playingVideo._id === video._id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                    <div className="h-4 w-4 bg-primary rounded-full animate-pulse" />
                                                </div>
                                            )}
                                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                                {video.duration}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <h5 className={`text-sm font-medium line-clamp-2 mb-1 ${playingVideo._id === video._id ? 'text-primary' : 'text-foreground'}`}>
                                                {video.title}
                                            </h5>
                                        </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}
                </div>
            </div>
        )}

        {/* Assignment Modal */}
        {selectedAssignment && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-2xl bg-card rounded-xl shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-bold">Assignment Details</h2>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedAssignment(null)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold mb-2">{selectedAssignment.title}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                                <span>Due: {new Date(selectedAssignment.dueDate).toLocaleString()}</span>
                                <span>Marks: {selectedAssignment.maxMarks}</span>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                {selectedAssignment.description}
                            </div>
                        </div>

                        <form onSubmit={handleAssignmentSubmit} className="space-y-4 pt-4 border-t">
                             <h4 className="font-semibold">Submit Your Work</h4>
                             <div className="space-y-2">
                                 <label className="text-sm font-medium">Project Link / File URL</label>
                                 <Input 
                                    placeholder="https://github.com/username/project or Google Drive Link" 
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                    required
                                 />
                                 <p className="text-xs text-muted-foreground">Paste the link to your work (GitHub, Drive, Figma, etc.)</p>
                             </div>
                             <div className="flex justify-end gap-3 pt-2">
                                 <Button type="button" variant="ghost" onClick={() => setSelectedAssignment(null)}>Cancel</Button>
                                 <Button type="submit">Submit Assignment</Button>
                             </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default BatchLearningHub;
