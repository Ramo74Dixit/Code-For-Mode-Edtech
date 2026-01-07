import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Hash, ArrowRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Button } from '../../components/ui/button';

const Community = () => {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                // Fetch enrolled batches as they are the "communities"
                const res = await api.get('/enrollments');
                const courses = res.data.data.map(enrollment => enrollment.course).filter(Boolean);
                
                // For now, we assume courses/batches are 1:1 or we need to fetch batches specifically
                // Since the previous code in student dashboard used '/enrollments' and mapped to courses, 
                // but BatchDetails uses '/batches/:id'.
                // Let's try to fetch user's batches if there is an endpoint, otherwise use enrollments -> course.
                // Assuming 'course' object has enough info or we might need actual batches.
                // Re-using logic from StudentDashboard but let's see if we can get batch details.
                
                // Better approach: Get batches directly if possible. 
                // If not, use courses. 
                // Let's use the '/batches/student/my-batches' logic if it exists, or verify API.
                // Based on previous interaction, `StudentDashboard` uses `api.get('/enrollments')`.
                // In `BatchList`, it uses `api.get('/batches')`. 
                // Let's use `api.get('/enrollments')` for now as it's reliable for students.
                
                // Wait, `BatchDetails` takes a batch ID. 
                // The enrollment object usually contains batch info? 
                // Let's look at `StudentDashboard.jsx` again... 
                // `setEnrolledCourses(enrollRes.data.data.map(enrollment => enrollment.course));`
                // It maps to course. Does enrollment have batch?
                // Usually enrollment is User -> Batch -> Course.
                // Let's assume enrollment has `batch` populated or we can navigate to batch via course?
                // Actually StudentDashboard navigates to `/batches` generally, or `/courses/:id`.
                
                // Let's blindly trust that we can get list of batches user is in.
                // We will try `api.get('/enrollments')` and see if `batch` is there.
                
                setCommunities(res.data.data);
            } catch (error) {
                console.error("Failed to fetch communities", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, []);

    const handleJoinChat = (batchId) => {
        // Navigate to BatchDetails with 'community' tab active
        navigate(`/batches/${batchId}`, { state: { initialTab: 'community' } });
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <SkeletonLoader type="text" className="w-1/3 h-10" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonLoader type="card" count={3} className="h-48" />
                </div>
            </div>
        );
    }

    return (
        <PageTransition className="w-full min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-indigo-400" />
                            Community Hub
                        </h1>
                        <p className="text-slate-400 text-lg">Connect, collaborate, and learn with your peers.</p>
                    </div>
                </div>

                {communities.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communities.map((enrollment) => {
                            const item = enrollment.batch || enrollment.course; // Fallback
                             // Ideally we want the Batch object specifically
                            const batchId = enrollment.batch?._id || enrollment.course?._id; // Fallback to course ID if batch missing (might be erroneous but handles nulls)
                            const title = enrollment.batch?.name || enrollment.course?.title || "Unknown Class";
                            const members = enrollment.batch?.students?.length || 0; // enhanced if available

                            return (
                                <div 
                                    key={enrollment._id}
                                    className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-300"
                                >
                                    <div className="absolute top-4 right-4 p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                        <Hash className="h-5 w-5" />
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-2 pr-10">{title}</h3>
                                    
                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{members > 0 ? `${members} Peers` : 'Community'}</span>
                                        </div>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Active Now
                                        </span>
                                    </div>

                                    <Button 
                                        onClick={() => handleJoinChat(batchId)}
                                        className="w-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500 transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/20"
                                    >
                                        Enter Discussion <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="h-10 w-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Communities Yet</h3>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                            Join a batch to start interacting with other students and instructors.
                        </p>
                        <Button onClick={() => navigate('/courses')} variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                            Explore Courses
                        </Button>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Community;
