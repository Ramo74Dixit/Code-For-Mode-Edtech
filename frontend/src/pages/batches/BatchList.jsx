import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, Users, Calendar, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { motion } from 'framer-motion';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isTrainer, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const canCreateBatch = isTrainer || isAdmin;
  const [studentEnrollments, setStudentEnrollments] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      setError(null);
      const batchesRes = await api.get('/batches');
      
      let finalBatches = batchesRes.data?.data || [];
      let enrollmentsMap = {};

      if (!isTrainer && !isAdmin) {
          const enrollRes = await api.get('/enrollments');
          const enrollments = enrollRes.data?.data || [];
          const validEnrollments = enrollments.filter(e => e && e.course);
          const enrolledCourseIds = validEnrollments.map(e => e.course._id?.toString());
          
          validEnrollments.forEach(e => {
              if(e.course?._id) enrollmentsMap[e.course._id.toString()] = e;
          });
          setStudentEnrollments(enrollmentsMap);

          finalBatches = finalBatches.filter(b => 
              b.course && 
              enrolledCourseIds.includes(b.course._id?.toString()) && 
              (b.status === 'upcoming' || b.status === 'ongoing')
          ).sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
      }

      setBatches(finalBatches);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setError("Failed to load batches. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBatch = async (e, batchId) => {
      e.stopPropagation();
      e.preventDefault();

      try {
          await api.post(`/batches/${batchId}/enroll`);
          alert('Successfully joined the batch!');
          fetchData(); 
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
     return (
        <div className="min-h-screen bg-slate-950 p-8 space-y-8">
            <div className="flex justify-between items-center">
                 <SkeletonLoader type="text" className="w-64 h-12" />
                 <SkeletonLoader type="text" className="w-32 h-10" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonLoader count={6} type="card" className="h-64" />
            </div>
        </div>
     );
  }

  return (
    <PageTransition className="w-full min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-indigo-500/30">
        
       {/* Ambient Glow */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px]" />
       </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                   Active Learning Batches
                   <Sparkles className="h-6 w-6 text-amber-500" />
               </h1>
               <p className="text-slate-400 text-lg">
                   {isTrainer ? "Manage your teaching schedules" : "Join upcoming live training sessions"}
               </p>
            </div>
            {canCreateBatch && (
              <Button 
                onClick={() => navigate('/batches/create')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Batch
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
             </div>
             <Input 
                placeholder="Search batches..." 
                className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:ring-indigo-500 rounded-xl h-12 transition-all hover:bg-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>

          {/* Error Disply */}
          {error && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                 <p>{error}</p>
                 <Button variant="link" onClick={fetchData} className="text-red-300 underline">Retry</Button>
             </div>
          )}

          {/* Batches Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBatches.map((batch, index) => {
               const myEnrollment = studentEnrollments[batch.course?._id?.toString()];
               const isJoinedThis = myEnrollment?.batch?._id === batch._id;
               const isJoinedOther = myEnrollment?.batch && !isJoinedThis;
               
               const statusColor = {
                   upcoming: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                   ongoing: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                   completed: 'bg-slate-700/50 text-slate-400 border-slate-600/30'
               };

                return (
                 <motion.div
                    key={batch._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                 >
                  <div 
                    onClick={() => {
                        if (isJoinedThis) navigate(`/batches/${batch._id}/learn`);
                        else if (!isJoinedOther) navigate(`/batches/${batch._id}`);
                    }}
                    className={cn(
                        "group relative h-full bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 hover:bg-slate-900/60 transition-all duration-300 cursor-pointer overflow-hidden",
                        isJoinedThis ? "ring-1 ring-emerald-500/50 border-emerald-500/20 bg-emerald-950/10" : "hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10"
                    )}
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", statusColor[batch.status] || statusColor.completed)}>
                            {batch.status}
                        </div>
                        {isJoinedThis && <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> ENROLLED</div>}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">{batch.name}</h3>
                    <p className="text-slate-400 text-sm mb-6 line-clamp-1">{batch.course?.title || 'Unknown Course'}</p>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span>Starts {new Date(batch.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span>{batch.currentEnrollment} / {batch.maxStudents} Students</span>
                        </div>
                    </div>
                    
                    {/* Action Area */}
                    <div className="pt-4 border-t border-slate-800/50">
                        {(!isTrainer && !isAdmin) ? (
                            isJoinedThis ? (
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 group-hover:scale-[1.02] transition-transform">
                                    Go to Classroom <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : isJoinedOther ? (
                                <Button variant="secondary" className="w-full bg-slate-800 text-slate-500 cursor-not-allowed" disabled>
                                    Already Enrolled
                                </Button>
                            ) : (
                                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/5" onClick={(e) => handleJoinBatch(e, batch._id)}>
                                    Join Batch
                                </Button>
                            )
                        ) : (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Owner</span>
                                <span className="font-bold text-white">{batch.trainer?.name}</span>
                            </div>
                        )}
                    </div>

                  </div>
                 </motion.div>
            )})}
            {filteredBatches.length === 0 && (
                 <div className="col-span-full text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                    <Search className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No batches found matching your search.</p>
                 </div>
            )}
          </div>
      </div>
    </PageTransition>
  );
};

export default BatchList;
