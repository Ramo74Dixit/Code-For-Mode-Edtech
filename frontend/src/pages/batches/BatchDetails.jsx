import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Users, Calendar, Video, BookOpen, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BatchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, isTrainer } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchBatch = async () => {
            try {
                const res = await api.get(`/batches/${id}`);
                setBatch(res.data.data);
            } catch (error) {
                console.error('Failed to fetch batch', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatch();
    }, [id]);

    const handleEnroll = async () => {
        try {
            await api.post(`/batches/${id}/enroll`);
            // Refresh batch data or show success
            alert("Enrolled successfully!");
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.message || 'Enrollment failed');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!batch) return <div className="p-10 text-center">Batch not found</div>;

    const isEnrolled = batch.enrolledStudents?.some(student => student._id === user?._id || student === user?._id);

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
                                {/* Status badge could go here */}
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">{batch.description}</p>
                             
                             {/* Tabs Navigation */}
                             <div className="flex border-b mt-6">
                                {['overview', 'classes', 'content', 'assignments'].map(tab => (
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
                                 
                                 {/* Placeholders for other tabs */}
                                 {activeTab === 'classes' && <p>Live classes will be listed here.</p>}
                                 {activeTab === 'content' && <p>Course videos and resources.</p>}
                                 {activeTab === 'assignments' && <p>Assignments and quizzes.</p>}
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
                                <Button className="w-full" variant="secondary" size="lg" disabled>
                                    Already Enrolled
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
                    
                    {/* Trainer Card */}
                    <Card>
                         <CardHeader><CardTitle className="text-base">Trainer</CardTitle></CardHeader>
                         <CardContent className="flex items-center gap-3 pt-0">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                    {batch.trainer?.name?.[0] || 'T'}
                                </div>
                                <div>
                                    <div className="font-medium">{batch.trainer?.name}</div>
                                    <div className="text-xs text-muted-foreground">{batch.trainer?.email}</div>
                                </div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BatchDetails;
