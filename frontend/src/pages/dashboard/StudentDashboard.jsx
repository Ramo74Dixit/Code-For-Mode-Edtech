import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Video, Calendar, ArrowRight, Sparkles, PlusCircle, TrendingUp, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button'; 
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Available Courses
                const coursesRes = await api.get('/courses');
                setAvailableCourses(coursesRes.data.data);

                // Fetch Enrolled Courses
                const enrollRes = await api.get('/enrollments');
                setEnrolledCourses(enrollRes.data.data.map(enrollment => enrollment.course));
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Mock data
    const stats = [
        { 
            title: 'Enrolled Courses', 
            value: enrolledCourses.length.toString(), 
            icon: BookOpen, 
            color: 'text-blue-400', 
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            trend: '+2 this month'
        },
        { 
            title: 'Learning Streak', 
            value: '3 Days', 
            icon: Zap, 
            color: 'text-amber-400', 
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            trend: 'Keep it up!'
        },
        { 
            title: 'Pending Tasks', 
            value: '0', 
            icon: Calendar, 
            color: 'text-rose-400', 
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            trend: 'All caught up'
        },
    ];

    if (loading) {
        return (
            <div className="w-full space-y-8 p-8 min-h-screen bg-slate-950">
                <div className="flex justify-between items-center mb-8">
                     <SkeletonLoader type="text" className="w-1/3 h-10" />
                     <SkeletonLoader type="rectangular" className="w-32 h-10 rounded-lg" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <SkeletonLoader type="card" count={3} className="h-40" />
                </div>
                <div className="grid gap-6 md:grid-cols-3 h-96">
                     <div className="md:col-span-2"><SkeletonLoader type="card" className="h-full" /></div>
                     <div><SkeletonLoader type="card" className="h-full" /></div>
                </div>
            </div>
        );
    }

    return (
        <PageTransition className="w-full min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-indigo-500/30">
            
            {/* Background Glows */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                            Hello, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name}</span>
                            <span className="inline-block ml-3 animate-wave">👋</span>
                        </h1>
                        <p className="text-slate-400 text-lg flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            Ready to level up your skills today?
                        </p>
                    </div>
                    <div>
                         <Button 
                            onClick={() => navigate('/courses')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all rounded-full px-6 py-6"
                         >
                            Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                    </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {stats.map((stat, index) => (
                        <div 
                            key={index} 
                            className={`
                                relative overflow-hidden rounded-2xl p-6 border ${stat.border} bg-slate-900/50 backdrop-blur-sm
                                hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group
                            `}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity`}>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                                <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                                    <span>{stat.trend}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    
                    {/* My Courses Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-indigo-400" />
                                {parseInt(stats[0].value) > 0 ? 'Continue Learning' : 'Start Your Journey'}
                            </h2>
                            {parseInt(stats[0].value) > 0 && (
                                <Button variant="link" className="text-indigo-400" onClick={() => navigate('/batches')}>View All</Button>
                            )}
                        </div>

                        {parseInt(stats[0].value) > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {enrolledCourses.filter(Boolean).slice(0, 4).map(course => (
                                    <div 
                                        key={course._id} 
                                        className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer shadow-lg shadow-black/20"
                                        onClick={() => navigate(`/batches`)} // Ideally should go to specific batch
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            {course.thumbnail ? (
                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                    <BookOpen className="h-10 w-10 text-slate-600" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-1 rounded-md mb-2 inline-block shadow-lg">ENROLLED</span>
                                                <h4 className="font-bold text-white line-clamp-1">{course.title}</h4>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                             <div className="flex justify-between text-xs text-slate-400 mb-2">
                                                 <span>Progress</span>
                                                 <span>15%</span>
                                             </div>
                                             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                 <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[15%] rounded-full" />
                                             </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {availableCourses.slice(0, 4).map(course => (
                                    <div 
                                        key={course._id} 
                                        className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer"
                                        onClick={() => navigate(`/courses/${course._id}`)}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            {course.thumbnail ? (
                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                    <BookOpen className="h-10 w-10 text-slate-600" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                                ₹{course.price}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">{course.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="bg-slate-800 px-2 py-1 rounded">{course.category}</span>
                                                <span>• {course.level}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Live Sessions (Sidebar) */}
                    <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Video className="h-5 w-5 text-rose-400" />
                                Up Next
                            </h2>
                        </div>
                        
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mb-4 animate-pulse">
                                <Clock className="h-8 w-8 text-rose-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Live Sessions</h3>
                            <p className="text-slate-500 text-sm max-w-[200px]">
                                Relax! You have no upcoming classes scheduled for today.
                            </p>
                            <Button variant="outline" className="mt-6 border-slate-700 hover:bg-slate-800 text-slate-300">
                                View Full Schedule
                            </Button>
                        </div>

                         {/* Mini Motivation Card */}
                         <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                 <Zap className="h-24 w-24" />
                             </div>
                             <h3 className="font-bold text-lg mb-2 relative z-10">Did you know?</h3>
                             <p className="text-indigo-100 text-sm relative z-10 mb-4">
                                 Consistency is key! Studying for just 30 mins a day is better than cramming for 5 hours once a week.
                             </p>
                             <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                                 <div className="h-full bg-white/50 w-[70%]" />
                             </div>
                             <p className="text-xs text-indigo-200 mt-2 font-mono">Daily Goal: 70%</p>
                         </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default StudentDashboard;