import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, BookOpen, DollarSign, Calendar, Plus, Video, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Modals
import CreateBatchModal from '../../components/dashboard/trainer/CreateBatchModal';
import CreateCourseModal from '../../components/dashboard/trainer/CreateCourseModal';
import ScheduleLiveModal from '../../components/dashboard/trainer/ScheduleLiveModal';
import CreateAssignmentModal from '../../components/dashboard/trainer/CreateAssignmentModal';

const TrainerDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    
    // Data State
    const [stats, setStats] = useState({
        revenue: 0,
        activeBatches: 0,
        totalCourses: 0,
        totalStudents: 0
    });
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [liveSessions, setLiveSessions] = useState([]);
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

            console.log("Fetching dashboard data...");

            // Parallel fetching
            const [batchesRes, coursesRes] = await Promise.all([
                axios.get('http://localhost:5001/api/batches/trainer/my-batches', { headers }),
                axios.get('http://localhost:5001/api/courses/trainer/my-courses', { headers })
            ]);

            console.log("Batches Response:", batchesRes.data);
            console.log("Courses Response:", coursesRes.data);

            setBatches(batchesRes.data.data || []);
            setCourses(coursesRes.data.data || []);

            // Calculate stats
            setStats({
                revenue: 0,
                activeBatches: batchesRes.data.data?.length || 0,
                totalCourses: coursesRes.data.data?.length || 0,
                totalStudents: 0
            });
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            console.error("Error Details:", error.response?.data);
            // Optionally set empty state on error but LOG IT first
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

    const handleSessionScheduled = (newSession) => {
        // Ideally fetch upcoming sessions again or add to list if we maintain it
        console.log("Session scheduled:", newSession);
    };

    const handleAssignmentCreated = (newAssignment) => {
        console.log("Assignment created:", newAssignment);
    };

    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, <span className="text-primary">{user?.name}</span>
                    </h1>
                    <p className="text-muted-foreground">Manage your educational empire from one place.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setIsBatchModalOpen(true)} className="gap-2">
                        <Plus size={16} /> New Batch
                    </Button>
                    <Button onClick={() => setIsCourseModalOpen(true)} variant="outline" className="gap-2">
                        <BookOpen size={16} /> New Course
                    </Button>
                    <Button onClick={() => setIsLiveModalOpen(true)} variant="outline" className="gap-2">
                        <Video size={16} /> Go Live
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`₹${stats.revenue}`} icon={DollarSign} color="text-green-500" bg="bg-green-500/10" />
                <StatCard title="Active Batches" value={stats.activeBatches} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
                <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} color="text-purple-500" bg="bg-purple-500/10" />
                <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="text-orange-500" bg="bg-orange-500/10" />
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {['overview', 'batches', 'courses'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-40">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Recent Batches</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {batches.length > 0 ? (
                                            <div className="space-y-4">
                                                {batches.slice(0, 3).map(batch => (
                                                    <div key={batch._id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                                        <div>
                                                            <p className="font-medium">{batch.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(batch.startDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-sm font-medium">₹{batch.batchPrice}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">No batches created yet.</p>
                                        )}
                                        <Button variant="link" onClick={() => setActiveTab('batches')} className="px-0 mt-4">View all batches</Button>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => setIsAssignmentModalOpen(true)}>
                                            <FileText className="h-6 w-6" />
                                            Create Assignment
                                        </Button>
                                        <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => setIsLiveModalOpen(true)}>
                                            <Calendar className="h-6 w-6" />
                                            Schedule Class
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'batches' && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {batches.map(batch => (
                                    <Card key={batch._id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{batch.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-lg">₹{batch.batchPrice}</span>
                                                <Button variant="outline" size="sm">Manage</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                <Button variant="outline" className="h-full border-dashed min-h-[150px] flex flex-col gap-2" onClick={() => setIsBatchModalOpen(true)}>
                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-muted-foreground">Create New Batch</span>
                                </Button>
                            </div>
                        )}

                        {activeTab === 'courses' && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {courses.map(course => (
                                    <Card key={course._id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{course.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{course.category}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-lg">₹{course.price}</span>
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                <Button variant="outline" className="h-full border-dashed min-h-[150px] flex flex-col gap-2" onClick={() => setIsCourseModalOpen(true)}>
                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-muted-foreground">Create New Course</span>
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <CreateBatchModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onBatchCreated={handleBatchCreated} />
            <CreateCourseModal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} onCourseCreated={handleCourseCreated} />
            <ScheduleLiveModal isOpen={isLiveModalOpen} onClose={() => setIsLiveModalOpen(false)} onSessionScheduled={handleSessionScheduled} />
            <CreateAssignmentModal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} onAssignmentCreated={handleAssignmentCreated} />
        </div>
    );
};

export default TrainerDashboard;

