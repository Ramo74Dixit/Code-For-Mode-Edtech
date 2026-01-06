import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isTrainer, isAdmin } = useAuth();
  
  const canCreateBatch = isTrainer || isAdmin;
  const [studentEnrollments, setStudentEnrollments] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const batchesRes = await api.get('/batches');
      
      let finalBatches = batchesRes.data.data;
      let enrollmentsMap = {};

      if (!isTrainer && !isAdmin) {
          const enrollRes = await api.get('/enrollments');
          const enrollments = enrollRes.data.data || [];
          
          // Safety check: Filter out enrollments where course might be null (deleted courses)
          const validEnrollments = enrollments.filter(e => e && e.course);
          const enrolledCourseIds = validEnrollments.map(e => e.course._id);
          
          // Map for easy lookup
          validEnrollments.forEach(e => {
              enrollmentsMap[e.course._id] = e;
          });
          setStudentEnrollments(enrollmentsMap);

          finalBatches = finalBatches.filter(b => 
              b.course && // Ensure batch has a course
              enrolledCourseIds.includes(b.course._id) && 
              (b.status === 'upcoming' || b.status === 'ongoing')
          ).sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
      }

      setBatches(finalBatches);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBatch = async (e, batchId) => {
      e.preventDefault(); // Prevent Link navigation
      e.stopPropagation();

      try {
          await api.post(`/batches/${batchId}/enroll`);
          alert('Successfully joined the batch!');
          fetchData(); // Refresh to update UI
      } catch (error) {
          console.error('Join Error', error);
          alert(error.response?.data?.message || 'Failed to join batch');
      }
  };

  const filteredBatches = batches.filter(batch => 
    batch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading batches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
           <p className="text-muted-foreground">Join upcoming live training sessions</p>
        </div>
        {canCreateBatch && (
          <Link to="/batches/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search batches..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.map((batch) => {
           const myEnrollment = studentEnrollments[batch.course?._id];
           const isJoinedThis = myEnrollment?.batch?._id === batch._id;
           const isJoinedOther = myEnrollment?.batch && !isJoinedThis;
           
           return (
          <Link key={batch._id} to={`/batches/${batch._id}`}>
            <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 ${isJoinedThis ? 'border-l-green-500 ring-2 ring-green-500/20' : 'border-l-primary'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{batch.name}</CardTitle>
                    <span className={cn(
                        "px-2 py-1 text-xs rounded-full capitalize",
                        batch.status === 'upcoming' ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100" : 
                        batch.status === 'ongoing' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100" :
                        "bg-gray-100 text-gray-700"
                    )}>
                        {batch.status}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {batch.course?.title || 'Unknown Course'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Starts: {new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{batch.currentEnrollment} / {batch.maxStudents} Students</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t mt-4">
                    {/* Role specific actions */}
                    {!isTrainer && !isAdmin ? (
                        <div className="w-full">
                            {isJoinedThis ? (
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={(e) => e.preventDefault()}>
                                    Joined
                                </Button>
                            ) : isJoinedOther ? (
                                <Button variant="secondary" className="w-full" disabled>
                                    Already in a batch
                                </Button>
                            ) : (
                                <Button className="w-full" onClick={(e) => handleJoinBatch(e, batch._id)}>
                                    Join Batch
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div>
                                <span className="text-xs text-muted-foreground">Price</span>
                                <div className="font-bold text-lg">₹{batch.batchPrice}</div>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Trainer</span>
                                <div className="text-sm font-medium">{batch.trainer?.name}</div>
                            </div>
                        </>
                    )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )})}
        {filteredBatches.length === 0 && (
             <div className="col-span-full text-center py-12 border rounded-lg bg-card border-dashed">
                <p className="text-muted-foreground">No batches found matching your search.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default BatchList;
