import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
    Users, BookOpen, DollarSign, Calendar, Plus, Video, FileText, 
    TrendingUp, BarChart3, MoreHorizontal, Search 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Modals
import CreateBatchModal from '../../components/dashboard/trainer/CreateBatchModal';
import CreateCourseModal from '../../components/dashboard/trainer/CreateCourseModal';
import ScheduleLiveModal from '../../components/dashboard/trainer/ScheduleLiveModal';
import CreateAssignmentModal from '../../components/dashboard/trainer/CreateAssignmentModal';

const TrainerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
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

            const [batchesRes, coursesRes] = await Promise.all([
                axios.get('http://localhost:5001/api/batches/trainer/my-batches', { headers }),
                axios.get('http://localhost:5001/api/courses/trainer/my-courses', { headers })
            ]);

            const batchesData = batchesRes.data.data || [];
            const coursesData = coursesRes.data.data || [];

            setBatches(batchesData);
            setCourses(coursesData);

            // Calculate Mock Revenue (since we don't track sales yet)
            // Mock: 10 students per batch * batchPrice
            const estimatedRevenue = batchesData.reduce((acc, b) => acc + (b.batchPrice * (b.currentEnrollment || 5)), 0);

            setStats({
                revenue: estimatedRevenue,
                activeBatches: batchesData.length,
                totalCourses: coursesData.length,
                totalStudents: batchesData.reduce((acc, b) => acc + (b.currentEnrollment || 0), 0)
            });
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setBatches([]);
            setCourses([]);
            setLoading(false);
        }
    };

    // ... Event Handlers ...
    const handleBatchCreated = (newBatch) => {
        setBatches([...batches, newBatch]);
        setStats(prev => ({ ...prev, activeBatches: prev.activeBatches + 1 }));
    };

    const handleCourseCreated = (newCourse) => {
        setCourses([...courses, newCourse]);
        setStats(prev => ({ ...prev, totalCourses: prev.totalCourses + 1 }));
    };

    const handleSessionScheduled = () => {};
    const handleAssignmentCreated = () => {};


    return (
        <div className="flex flex-col min-h-screen bg-muted/10">
            {/* Top Bar / Header */}
            <div className="border-b bg-background px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="fill-primary text-primary" />
                        Instructor Studio
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsCourseModalOpen(true)} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> New Course
                    </Button>
                    <Button onClick={() => setIsBatchModalOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Create Batch
                    </Button>
                </div>
            </div>

            <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
                
                {/* Stats Command Center */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">+20% from last month</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalStudents}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across {stats.activeBatches} batches</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalCourses}</div>
                            <p className="text-xs text-muted-foreground mt-1">Published</p>
                        </CardContent>
                    </Card>
                     <Card className="border-l-4 border-l-orange-500 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsLiveModalOpen(true)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Go Live</CardTitle>
                            <Video className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-medium text-orange-600">Schedule Now &rarr;</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid gap-8 lg:grid-cols-3">
                    
                     {/* Left: Batches Table (Takes 2 cols) */}
                     <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Active Batches</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input 
                                    placeholder="Search batches..." 
                                    className="w-full pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        <Card>
                             <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[40%]">Batch Name</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Dates</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Students</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {batches.length > 0 ? (
                                            batches.map(batch => (
                                                <tr key={batch._id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{batch.name}</span>
                                                            <span className="text-xs text-muted-foreground font-normal">₹{batch.batchPrice}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-xs">
                                                        {new Date(batch.startDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                       <div className="flex items-center gap-2">
                                                            <Users className="h-3 w-3 text-muted-foreground" /> 
                                                            {batch.currentEnrollment || 0}
                                                       </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-700 hover:bg-green-100/80">
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                         <Button variant="ghost" size="sm" onClick={() => navigate(`/batches/${batch._id}`)}>
                                                            Manage
                                                         </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                    No batches found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                             </div>
                        </Card>
                     </div>

                     {/* Right: Quick Stats / Courses (Takes 1 col) */}
                     <div className="space-y-6">
                         <Card>
                             <CardHeader>
                                 <CardTitle className="text-lg">Your Courses</CardTitle>
                                 <CardDescription>Top performing content</CardDescription>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                 {courses.slice(0, 5).map(course => (
                                     <div key={course._id} className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                             <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                                                  {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />}
                                             </div>
                                             <div className="space-y-1">
                                                 <p className="text-sm font-medium leading-none line-clamp-1 w-32">{course.title}</p>
                                                 <p className="text-xs text-muted-foreground">₹{course.price}</p>
                                             </div>
                                         </div>
                                         <Button variant="ghost" size="icon" className="h-8 w-8">
                                             <MoreHorizontal className="h-4 w-4" />
                                         </Button>
                                     </div>
                                 ))}
                                 {courses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No courses yet.</p>}
                                 
                                 <Button variant="outline" className="w-full" onClick={() => setIsCourseModalOpen(true)}>
                                     View All Courses
                                 </Button>
                             </CardContent>
                         </Card>

                         <Card className="bg-primary/5 border-primary/20">
                             <CardHeader>
                                 <CardTitle className="text-lg">Quick Tasks</CardTitle>
                             </CardHeader>
                             <CardContent className="grid gap-2">
                                 <Button variant="outline" className="justify-start bg-background" onClick={() => setIsAssignmentModalOpen(true)}>
                                     <FileText className="mr-2 h-4 w-4" />
                                     Create Assignment
                                 </Button>
                                 <Button variant="outline" className="justify-start bg-background" onClick={() => setIsLiveModalOpen(true)}>
                                     <Video className="mr-2 h-4 w-4" />
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
            <CreateAssignmentModal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} onAssignmentCreated={handleAssignmentCreated} />
        </div>
    );
};

export default TrainerDashboard;

