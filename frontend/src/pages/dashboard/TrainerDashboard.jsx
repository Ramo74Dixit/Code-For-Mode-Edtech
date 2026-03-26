import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
    Users, BookOpen, DollarSign, Calendar, Plus, Video, FileText, 
    TrendingUp, BarChart3, MoreHorizontal, Search, Sparkles, Trophy, Zap, Clock, IndianRupee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow } from 'date-fns';

// Modals
import CreateBatchModal from '../../components/dashboard/trainer/CreateBatchModal';
import CreateCourseModal from '../../components/dashboard/trainer/CreateCourseModal';
import ScheduleLiveModal from '../../components/dashboard/trainer/ScheduleLiveModal';
import CreateAssignmentModal from '../../components/dashboard/trainer/CreateAssignmentModal';

const TrainerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Data State
    const [stats, setStats] = useState({
        revenue: 0,
        activeBatches: 0,
        totalCourses: 0,
        totalStudents: 0
    });
    const [batches, setBatches] = useState([]);
    const [batchStats, setBatchStats] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [batchesRes, coursesRes, statsRes] = await Promise.all([
                axios.get('https://code-for-mode-edtech.onrender.com/api/batches/trainer/my-batches', { headers }),
                axios.get('https://code-for-mode-edtech.onrender.com/api/courses/trainer/my-courses', { headers }),
                axios.get('https://code-for-mode-edtech.onrender.com/api/batches/trainer/dashboard-stats', { headers })
            ]);

            const batchesData = batchesRes.data.data || [];
            const coursesData = coursesRes.data.data || [];
            const dashStats = statsRes.data.data || {};

            setBatches(batchesData);
            setCourses(coursesData);
            setBatchStats(dashStats.batchStats || []);

            setStats({
                revenue: dashStats.totalRevenue || 0,
                activeBatches: dashStats.totalBatches || batchesData.length,
                totalCourses: dashStats.totalCourses || coursesData.length,
                totalStudents: dashStats.totalStudents || 0
            });
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setBatches([]);
            setCourses([]);
            setLoading(false);
        }
    };

    const handleBatchCreated = (newBatch) => {
        setBatches([...batches, newBatch]);
        setStats(prev => ({ ...prev, activeBatches: prev.activeBatches + 1 }));
    };

    const handleCourseCreated = (newCourse) => {
        setCourses([...courses, newCourse]);
        setStats(prev => ({ ...prev, totalCourses: prev.totalCourses + 1 }));
    };

    const handleSessionScheduled = () => { fetchDashboardData(); };
    const handleAssignmentCreated = () => {};

    // Format next session time
    const formatNextSession = (nextSession) => {
        if (!nextSession || !nextSession.startTime) return null;
        const date = new Date(nextSession.startTime);
        if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
        if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
        return format(date, 'MMM d, h:mm a');
    };

    // Get batch stats for a batch
    const getBatchStat = (batchId) => {
        return batchStats.find(bs => bs.batchId === batchId) || {};
    };

    if (loading) {
        return (
            <div className="w-full space-y-8 p-8 min-h-screen bg-slate-950">
                <div className="flex justify-between items-center mb-8">
                     <SkeletonLoader type="text" className="w-64 h-12" />
                     <div className="flex gap-2">
                        <SkeletonLoader type="rectangular" className="w-32 h-10 rounded-lg" />
                     </div>
                </div>
                <div className="grid gap-6 md:grid-cols-4">
                    <SkeletonLoader type="card" count={4} className="h-40" />
                </div>
                <div className="grid gap-6 md:grid-cols-3 h-96">
                     <div className="md:col-span-2"><SkeletonLoader type="card" className="h-full" /></div>
                     <div><SkeletonLoader type="card" className="h-full" /></div>
                </div>
            </div>
        );
    }

    return (
        <PageTransition className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Ambient Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Top Bar / Header */}
            <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <BarChart3 className="text-emerald-500" />
                        Instructor Studio
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsCourseModalOpen(true)} size="sm" variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300">
                        <Plus className="h-4 w-4 mr-2" /> New Course
                    </Button>
                    <Button onClick={() => setIsBatchModalOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20">
                        <Plus className="h-4 w-4 mr-2" /> Create Batch
                    </Button>
                </div>
            </div>

            <div className="relative z-10 p-8 space-y-8 max-w-7xl mx-auto w-full">
                
                {/* Stats Command Center */}
                <div className="grid gap-6 md:grid-cols-4">
                    {[
                        { title: 'Total Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', trend: `From ${stats.totalStudents} enrollments` },
                        { title: 'Active Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', trend: `${stats.activeBatches} Batches` },
                        { title: 'Published Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', trend: 'Content' },
                        { title: 'Go Live', value: 'Webinar', icon: Video, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', action: true }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={stat.action ? () => setIsLiveModalOpen(true) : undefined}
                            className={`
                                relative overflow-hidden rounded-2xl p-6 border ${stat.border} bg-slate-900/50 backdrop-blur-sm
                                hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer
                            `}
                        >
                             <div className={`absolute top-0 right-0 p-4`}>
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{stat.title}</p>
                            <h3 className={`text-2xl font-bold text-white mb-2 ${stat.action && 'text-orange-400'}`}>{stat.value}</h3>
                            {!stat.action ? (
                                <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                    <span>{stat.trend}</span>
                                </div>
                            ) : (
                                <div className="text-xs font-bold text-orange-500 flex items-center gap-1">
                                    Schedule Now <Plus className="h-3 w-3" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid gap-8 lg:grid-cols-3">
                    
                     {/* Left: Batches Command Center (Takes 2 cols) */}
                     <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-400" />
                                Active Batches
                            </h2>
                             <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                    <Clock className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Trainer Command Cards */}
                        <div className="space-y-4">
                            {batches.length > 0 ? (
                                batches.map((batch, idx) => {
                                    const bs = getBatchStat(batch._id);
                                    const nextSessionText = formatNextSession(bs.nextSession);
                                    const students = bs.students || batch.currentEnrollment || 0;
                                    const totalClasses = bs.totalClasses || 0;
                                    const batchRevenue = bs.revenue || 0;

                                    return (
                                    <motion.div 
                                        key={batch._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-5 overflow-hidden hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-300"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

                                        <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                                            {/* Batch Info */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{batch.name}</h3>
                                                        <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                                            <BookOpen className="h-3 w-3" /> 
                                                            {batch.course?.title}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Active
                                                    </span>
                                                </div>

                                                <div className="flex gap-6 py-2">
                                                    <div className="text-center">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Students</p>
                                                        <p className="text-lg font-bold text-white">{students}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Classes</p>
                                                        <p className="text-lg font-bold text-white">{totalClasses}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Revenue</p>
                                                        <p className="text-lg font-bold text-emerald-400">₹{batchRevenue.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions & Next Session */}
                                            <div className="w-full sm:w-48 flex flex-col justify-between gap-3 border-l border-slate-800/50 sm:pl-6">
                                                <div className="space-y-1">
                                                     <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Next Session
                                                     </p>
                                                     <p className="text-sm text-white font-medium">
                                                        {nextSessionText || <span className="text-slate-500 italic">Not scheduled</span>}
                                                     </p>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button size="sm" variant="outline" className="h-8 border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700" onClick={() => navigate(`/batches/${batch._id}`)}>
                                                        Manage
                                                    </Button>
                                                    <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20">
                                                        Join
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar Visual */}
                                        <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${totalClasses > 0 ? Math.min((totalClasses / Math.max(totalClasses, 20)) * 100, 100) : 0}%` }} />
                                        </div>
                                    </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                    <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500">No active batches. Start teaching today!</p>
                                </div>
                            )}
                        </div>
                     </div>

                     {/* Right: Quick Stats / Courses (Takes 1 col) */}
                     <div className="space-y-6">
                         <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
                             <CardHeader>
                                 <CardTitle className="text-lg text-white">Top Courses</CardTitle>
                                 <CardDescription className="text-slate-500">Most enrolled content</CardDescription>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                 {courses.slice(0, 5).map(course => (
                                     <div key={course._id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg -mx-2 transition-colors">
                                         <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                                                  {course.thumbnail ? (
                                                      <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                                                  ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xs">IMG</div>
                                                  )}
                                             </div>
                                             <div className="space-y-1">
                                                 <p className="text-sm font-medium text-white leading-none line-clamp-1 w-32 group-hover:text-indigo-400 transition-colors">{course.title}</p>
                                                 <p className="text-xs text-slate-500">₹{course.price}</p>
                                             </div>
                                         </div>
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                                             <MoreHorizontal className="h-4 w-4" />
                                         </Button>
                                     </div>
                                 ))}
                                 {courses.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No published courses.</p>}
                                 
                                 <Button variant="outline" className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800" onClick={() => setIsCourseModalOpen(true)}>
                                     View All Library
                                 </Button>
                             </CardContent>
                         </Card>

                         <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800">
                             <CardHeader>
                                 <CardTitle className="text-lg text-white flex items-center gap-2">
                                     <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
                                 </CardTitle>
                             </CardHeader>
                             <CardContent className="grid gap-3">
                                 <Button variant="outline" className="justify-start bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setIsAssignmentModalOpen(true)}>
                                     <FileText className="mr-2 h-4 w-4 text-emerald-500" />
                                     Create Assignment
                                 </Button>
                                 <Button variant="outline" className="justify-start bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setIsLiveModalOpen(true)}>
                                     <Video className="mr-2 h-4 w-4 text-rose-500" />
                                     Schedule Webinar
                                 </Button>
                             </CardContent>
                         </Card>
                     </div>
                </div>
            </div>

             {/* Modals */}
            <CreateBatchModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onBatchCreated={handleBatchCreated} />
            <CreateCourseModal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} onCourseCreated={handleCourseCreated} />
            <ScheduleLiveModal isOpen={isLiveModalOpen} onClose={() => setIsLiveModalOpen(false)} onSessionScheduled={handleSessionScheduled} />
            {isAssignmentModalOpen && (
                <CreateAssignmentModal 
                    batchId={null} 
                    onClose={() => setIsAssignmentModalOpen(false)} 
                    onSuccess={handleAssignmentCreated} 
                />
            )}
        </PageTransition>
    );
};

export default TrainerDashboard;
