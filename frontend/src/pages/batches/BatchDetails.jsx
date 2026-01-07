import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Users, Calendar, Video, BookOpen, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import AddVideoModal from '../../components/dashboard/trainer/AddVideoModal';
import ScheduleLiveModal from '../../components/dashboard/trainer/ScheduleLiveModal';
import CreateAssignmentModal from '../../components/dashboard/trainer/CreateAssignmentModal';
import CreateTestModal from '../../components/dashboard/trainer/CreateTestModal';
import TestResultsModal from '../../components/dashboard/trainer/TestResultsModal';
import AddResourceModal from '../../components/dashboard/trainer/AddResourceModal';
import CreateAnnouncementModal from '../../components/dashboard/trainer/CreateAnnouncementModal';
import LiveChat from '../../components/chat/LiveChat';
import BatchChat from '../../components/chat/BatchChat';
import { Megaphone, Link as LinkIcon, Download, FileText, Code } from 'lucide-react';

const BatchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, isTrainer } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [viewingResultsForTest, setViewingResultsForTest] = useState(null);
    const [playingVideo, setPlayingVideo] = useState(null);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBatch = async () => {
            console.log("DEBUG: Fetching batch with ID:", id);
            try {
                const res = await api.get(`/batches/${id}`);
                console.log("DEBUG: Batch Fetch Response:", res.data);
                setBatch(res.data.data);
                setError(null); // Clear any previous errors on successful fetch
            } catch (error) {
                console.error('Failed to fetch batch', error);
                console.log("DEBUG: Batch Fetch Error:", error.response);
                setError(error.response?.data?.message || 'Failed to fetch batch details.');
            } finally {
                setLoading(false);
            }
        };
        fetchBatch();
    }, [id]);

    const handleEnroll = async () => {
        try {
            await api.post(`/batches/${id}/enroll`);
            alert("Enrolled successfully!");
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.message || 'Enrollment failed');
        }
    };

    const handleVideoAdded = (updatedBatch) => {
        setBatch(updatedBatch);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen space-y-4">
                <p className="text-xl text-red-500">Error: {error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    if (!batch) return <div className="p-10 text-center">Batch not found</div>;

    const isEnrolled = batch.enrolledStudents?.some(student => {
        const studentId = student._id || student;
        return studentId.toString() === user?._id?.toString();
    });
    
    console.log("DEBUG: BatchDetails Permission Check");
    console.log("User:", user);
    console.log("Is Trainer:", isTrainer);
    console.log("Batch Trainer:", batch.trainer);
    
    // Handle case where trainer might be an object or ID string
    const batchTrainerId = batch.trainer?._id || batch.trainer; 
    const isOwner = batchTrainerId === user?._id;
    
    console.log("Batch Trainer ID:", batchTrainerId);
    console.log("User ID:", user?._id);
    console.log("Is Owner:", isOwner);

    const canManage = isTrainer && isOwner;
    console.log("Can Manage:", canManage);

    return (
        <div className="space-y-6">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate('/batches')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Batches
            </Button>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl">{batch.name}</CardTitle>
                                    <p className="text-muted-foreground mt-1">{batch.course?.title}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">{batch.description}</p>
                             
                             <p className="text-muted-foreground">{batch.description}</p>
                             
                             <div className="flex border-b mt-6 overflow-x-auto">
                                {['overview', 'classes', 'content', 'assignments', 'resources', 'tests', 'announcements', 'community'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                                            activeTab === tab 
                                            ? 'border-primary text-primary' 
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                             </div>

                             <div className="py-6">
                                 {activeTab === 'overview' && (
                                     <div className="space-y-4">
                                         <h3 className="font-semibold text-lg">Schedule</h3>
                                         {batch.classSchedule?.length > 0 ? (
                                             <ul className="list-disc pl-5 text-muted-foreground">
                                                 {batch.classSchedule.map((s, i) => (
                                                     <li key={i}>{s.day}s at {s.startTime} - {s.endTime}</li>
                                                 ))}
                                             </ul>
                                         ) : <p className="text-muted-foreground">No specific schedule listed.</p>}
                                     </div>
                                 )}
                                 
                                 {activeTab === 'content' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Course Videos</h3>
                                            {canManage && (
                                                <Button size="sm" onClick={() => setIsVideoModalOpen(true)}>
                                                    <Video className="h-4 w-4 mr-2" />
                                                    Add Video
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {batch.videos?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {batch.videos.map((video, index) => (
                                                    <div key={index} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="relative w-40 h-24 bg-black rounded-md flex-shrink-0 overflow-hidden">
                                                            <img 
                                                                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                                                                alt={video.title}
                                                                className="object-cover w-full h-full"
                                                            />
                                                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                                                {video.duration}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium line-clamp-1">{video.title}</h4>
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{video.description}</p>
                                                            {video.isUnlisted && (
                                                                <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                                                    Unlisted
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-center">
                                                            <Button variant="ghost" size="sm" onClick={() => setPlayingVideo(video)}>
                                                                Watch
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No videos added yet.</p>
                                            </div>
                                        )}
                                     </div>
                                 )}

                                 {activeTab === 'classes' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Upcoming Live Classes</h3>
                                            {canManage && (
                                                <Button size="sm" onClick={() => setIsLiveModalOpen(true)}>
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    Schedule Class
                                                </Button>
                                            )}
                                        </div>

                                        {batch.liveSessions?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {batch.liveSessions.map((session, index) => {
                                                    // Extract ID for thumbnail/player
                                                    const getVideoId = (url) => {
                                                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
                                                        const match = url?.match(regExp);
                                                        return (match && match[2].length === 11) ? match[2] : null;
                                                    };
                                                    const videoId = getVideoId(session.youtubeLiveUrl);

                                                    return (
                                                        <div key={index} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                            <div className="relative w-40 h-24 bg-black rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                                {videoId ? (
                                                                    <img 
                                                                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                                                                        alt={session.title}
                                                                        className="object-cover w-full h-full opacity-80"
                                                                    />
                                                                ) : (
                                                                    <Video className="text-white h-8 w-8" />
                                                                )}
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                    <div className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                                                                        LIVE
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-medium line-clamp-1">{session.title}</h4>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {new Date(session.scheduledStartTime).toLocaleString()}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{session.description}</p>
                                                            </div>
                                                            <div className="flex flex-col justify-center">
                                                                <Button 
                                                                    size="sm" 
                                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                                    onClick={() => {
                                                                        setPlayingVideo({
                                                                            _id: session._id, // Ensure ID is passed for Room ID
                                                                            title: session.title,
                                                                            description: session.description,
                                                                            youtubeId: videoId,
                                                                            isLive: true
                                                                        });
                                                                    }}
                                                                >
                                                                    Join Class
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No live classes scheduled.</p>
                                            </div>
                                        )}
                                     </div>
                                 )}

                                 {activeTab === 'assignments' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Assignments</h3>
                                            {canManage && (
                                                <Button size="sm" onClick={() => setIsAssignmentModalOpen(true)}>
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    Create Assignment
                                                </Button>
                                            )}
                                        </div>

                                        {batch.assignments?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {batch.assignments.map((assignment, index) => (
                                                    <div key={index} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 13v6"/><path d="M9 16l3 3 3-3"/></svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium line-clamp-1">{assignment.title}</h4>
                                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                     <span className={`text-xs px-2 py-1 rounded-full ${
                                                                         new Date() > new Date(assignment.dueDate) 
                                                                         ? "bg-red-100 text-red-700" 
                                                                         : "bg-green-100 text-green-700"
                                                                     }`}>
                                                                         {new Date() > new Date(assignment.dueDate) ? "Closed" : "Active"}
                                                                     </span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                                                                <span>•</span>
                                                                <span>Points: {assignment.points}</span>
                                                                <span>•</span>
                                                                <span>Submissions: {assignment.totalSubmissions || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                <p>No assignments posted yet.</p>
                                            </div>
                                        )}
                                      </div>
                                 )}

                                 {activeTab === 'resources' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Study Material</h3>
                                            {canManage && (
                                                <Button size="sm" onClick={() => setIsResourceModalOpen(true)}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    Add Material
                                                </Button>
                                            )}
                                        </div>

                                        {batch.resources?.length > 0 ? (
                                            <div className="grid gap-3">
                                                {batch.resources.map((resource, index) => (
                                                    <a 
                                                        key={index} 
                                                        href={resource.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                                                    >
                                                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                            {resource.type === 'pdf' ? <FileText className="h-5 w-5" /> : 
                                                             resource.type === 'video' ? <Video className="h-5 w-5" /> :
                                                             <LinkIcon className="h-5 w-5" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium">{resource.title}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(resource.createdAt).toLocaleDateString()} • {resource.type}
                                                            </p>
                                                        </div>
                                                        <Button variant="ghost" size="icon">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No study materials added yet.</p>
                                            </div>
                                        )}
                                     </div>
                                 )}

                                 {activeTab === 'announcements' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Announcements</h3>
                                            {canManage && (
                                                <Button size="sm" onClick={() => setIsAnnouncementModalOpen(true)}>
                                                    <Megaphone className="h-4 w-4 mr-2" />
                                                    Make Announcement
                                                </Button>
                                            )}
                                        </div>

                                        {batch.announcements?.length > 0 ? (
                                            <div className="space-y-4">
                                                {batch.announcements.map((announcement, index) => (
                                                    <div key={index} className="p-4 border rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/50">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                                                <Megaphone className="h-4 w-4 text-yellow-600" />
                                                                {announcement.title}
                                                            </h4>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(announcement.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{announcement.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No announcements yet.</p>
                                            </div>
                                        )}
                                     </div>

                                 )}

                                 {activeTab === 'tests' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-lg">Coding Tests</h3>
                                            {canManage && (
                                                <Button size="sm" onClick={() => setIsTestModalOpen(true)}>
                                                    <Code className="h-4 w-4 mr-2" />
                                                    Create Test
                                                </Button>
                                            )}
                                        </div>

                                        {batch.tests?.length > 0 ? (
                                            <div className="grid gap-4">
                                                {batch.tests.map((test, index) => (
                                                    <div key={index} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                            <Code className="h-8 w-8" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium line-clamp-1">{test.title}</h4>
                                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{test.questions?.length} Question(s) • {test.timeLimit} mins</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={() => window.open(`/tests/${test._id}/start`, '_blank')}
                                                                    >
                                                                        View Test
                                                                    </Button>
                                                                    {canManage && (
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="secondary"
                                                                            className="ml-2"
                                                                            onClick={() => setViewingResultsForTest(test)}
                                                                        >
                                                                            Results
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                                <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No coding tests created yet.</p>
                                            </div>
                                        )}
                                      </div>
                                 )}
                                  {activeTab === 'community' && (
                                     <BatchChat roomId={batch._id} title={`${batch.name} Community`} />
                                  )}
                             </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div className="text-3xl font-bold text-primary">₹{batch.batchPrice}</div>
                            
                            {!isEnrolled ? (
                                <Button className="w-full" size="lg" onClick={handleEnroll} disabled={isTrainer}>
                                    Enroll Now
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                                    size="lg" 
                                    onClick={() => navigate(`/batches/${id}/learn`)}
                                >
                                    <BookOpen className="mr-2 h-5 w-5" />
                                    Go to Classroom
                                </Button>
                            )}

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{batch.currentEnrollment} / {batch.maxStudents} Students</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                         <CardHeader><CardTitle className="text-base">Trainer</CardTitle></CardHeader>
                         <CardContent className="flex items-center gap-3 pt-0 cursor-pointer hover:bg-muted/50 p-4 rounded-b-lg transition-colors" onClick={() => navigate(`/trainer/${batch.trainer?._id}`)}>
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden">
                                    {batch.trainer?.profileImage ? (
                                        <img src={batch.trainer.profileImage} alt={batch.trainer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        batch.trainer?.name?.[0] || 'T'
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium hover:underline">{batch.trainer?.name}</div>
                                    <div className="text-xs text-muted-foreground">{batch.trainer?.email}</div>
                                </div>
                         </CardContent>
                    </Card>
                </div>
            </div>

            <AddVideoModal 
                isOpen={isVideoModalOpen} 
                onClose={() => setIsVideoModalOpen(false)} 
                batchId={batch._id}
                onVideoAdded={handleVideoAdded}
            />

            <ScheduleLiveModal
                 isOpen={isLiveModalOpen}
                 onClose={() => setIsLiveModalOpen(false)}
                 batches={[batch]} // Pass current batch as the only option
                 onSessionScheduled={() => {
                     // Refresh batch data to show new session
                     // For now we can just reload the page or refetch if we extracted fetchBatch
                     window.location.reload(); 
                 }}
            />

            {isAssignmentModalOpen && (
                <CreateAssignmentModal
                    batchId={batch?._id}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}

            <AddResourceModal
                isOpen={isResourceModalOpen}
                onClose={() => setIsResourceModalOpen(false)}
                batchId={batch._id}
                onResourceAdded={() => window.location.reload()}
            />

            <CreateAnnouncementModal
                isOpen={isAnnouncementModalOpen}
                onClose={() => setIsAnnouncementModalOpen(false)}
                batchId={batch._id}
                onAnnouncementCreated={() => window.location.reload()}
            />

            {isTestModalOpen && (
                <CreateTestModal
                    batchId={batch._id}
                    onClose={() => setIsTestModalOpen(false)}
                    onSuccess={() => window.location.reload()}
                />
            )}

            {viewingResultsForTest && (
                <TestResultsModal
                    testId={viewingResultsForTest._id}
                    testTitle={viewingResultsForTest.title}
                    onClose={() => setViewingResultsForTest(null)}
                />
            )}

            {/* Advanced Video Player Overlay */}
            {playingVideo && (
                <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-background/50">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            {playingVideo.isLive ? <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse"/> : <Video className="h-5 w-5 text-primary" />}
                            {playingVideo.title}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => setPlayingVideo(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </Button>
                    </div>

                    {/* Main Content Split */}
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Left: Player Area */}
                        <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto">
                            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`} 
                                    title={playingVideo.title} 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <div className="mt-6 space-y-2">
                                <h1 className="text-2xl font-bold">{playingVideo.title}</h1>
                                <p className="text-muted-foreground whitespace-pre-wrap">{playingVideo.description}</p>
                            </div>
                        </div>

                        {/* Right: Playlist Sidebar (Only show if it's a recorded video playlist, or reuse for live chat maybe later) */}
                        {!playingVideo.isLive && (
                            <div className="w-full lg:w-96 border-l bg-muted/30 p-4 overflow-y-auto">
                                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Course Content</h3>
                                <div className="space-y-3">
                                    {batch.videos?.map((video, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => setPlayingVideo(video)}
                                            className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                                playingVideo._id === video._id || playingVideo.youtubeId === video.youtubeId
                                                ? 'bg-primary/10 ring-1 ring-primary/20' 
                                                : 'hover:bg-background/80 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="relative w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                                                    alt={video.title}
                                                    className="object-cover w-full h-full opacity-80"
                                                />
                                                {(playingVideo._id === video._id || playingVideo.youtubeId === video.youtubeId) && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-medium line-clamp-2 ${
                                                    playingVideo._id === video._id || playingVideo.youtubeId === video.youtubeId ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                    {video.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">{video.duration}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Live Chat */}
                        {playingVideo.isLive && (
                             <div className="w-full lg:w-96 border-l bg-muted/30 p-4 flex flex-col h-[500px] lg:h-auto">
                                <LiveChat roomId={playingVideo._id} title={playingVideo.title} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchDetails;
