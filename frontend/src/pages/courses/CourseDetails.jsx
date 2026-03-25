import React, { useEffect, useState } from 'react';
import { useRazorpay } from 'react-razorpay';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, BookOpen, Clock, Users, Globe, CheckCircle, Shield, Award, PlayCircle, ChevronDown, ChevronUp, Calendar, MapPin } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const Video = PlayCircle; // Alias for the sidebar icon

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isTrainer, user } = useAuth();
  const { Razorpay } = useRazorpay();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledBatchId, setEnrolledBatchId] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);

  // Batch state
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, enrollRes, batchesRes] = await Promise.all([
             api.get(`/courses/${id}`),
             api.get('/enrollments').catch(() => ({ data: { data: [] } })),
             api.get(`/batches?course=${id}`)
        ]);
        
        setCourse(courseRes.data.data);

        // Check enrollment
        const enrollment = enrollRes.data.data.find(e => e.course._id === id);
        if (enrollment) {
          setIsEnrolled(true);
          setEnrolledBatchId(enrollment.batch || null);
        }

        // Set batches
        const batchData = batchesRes.data.data || [];
        setBatches(batchData);
        if (batchData.length > 0) {
          setSelectedBatchId(batchData[0]._id);
        }

      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
        setBatchesLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const selectedBatch = batches.find(b => b._id === selectedBatchId);

  const handleEnroll = async () => {
      if (!user) {
          alert('Please login to enroll');
          navigate('/login');
          return;
      }

      if (isEnrolled) {
          // Go to classroom if already enrolled
          if (enrolledBatchId) {
            navigate(`/batches/${enrolledBatchId}/learn`);
          } else {
            navigate('/batches');
          }
          return;
      }

      if (!selectedBatchId) {
          alert('Please select a batch first');
          return;
      }

      try {
          const effectivePrice = selectedBatch?.batchPrice > 0 ? selectedBatch.batchPrice : course.price;

          if (effectivePrice === 0) {
               // Free enrollment — enroll in batch directly
               await api.post(`/batches/${selectedBatchId}/enroll`);
               alert('Enrolled Successfully! 🎓');
               navigate(`/batches/${selectedBatchId}/learn`);
               return;
          }

          const orderRes = await api.post('/payment/create-order', { courseId: id, batchId: selectedBatchId });
          const order = orderRes.data.data;

          const options = {
              key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
              amount: order.amount,
              currency: order.currency,
              name: "Code For Mode EdTech",
              description: `Enrollment for ${course.title}${selectedBatch ? ` - ${selectedBatch.name}` : ''}`,
              order_id: order.id,
              handler: async function (response) {
                  try {
                      const verifyRes = await api.post('/payment/verify-payment', {
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          courseId: id,
                          batchId: selectedBatchId
                      });

                      if (verifyRes.data.success) {
                          alert('Payment Successful! Welcome to the course. 🎓');
                          const enrolledBatch = verifyRes.data.batchId || selectedBatchId;
                          navigate(`/batches/${enrolledBatch}/learn`);
                      } else {
                          alert('Payment Verification Failed');
                      }
                  } catch (error) {
                      console.error('Verification Error', error);
                      alert('Payment Verification Failed');
                  }
              },
              prefill: {
                  name: user.name,
                  email: user.email,
                  contact: user.mobile || '' 
              },
              theme: {
                  color: "#6366f1"
              }
          };

          const rzp1 = new Razorpay(options);
          rzp1.open();

      } catch (error) {
          console.error('Enrollment Error', error);
          const msg = error.response?.data?.message || error.message || "Unknown Error";
          alert(`Failed to initiate enrollment: ${msg}`);
      }
  };

  if (loading) return (
      <div className="min-h-screen bg-slate-950 p-8 space-y-8">
          <SkeletonLoader className="h-96 w-full rounded-3xl" type="rectangular" />
          <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                  <SkeletonLoader className="h-12 w-3/4" type="text" />
                  <SkeletonLoader count={5} />
              </div>
              <div className="h-64"><SkeletonLoader type="card" className="h-full" /></div>
          </div>
      </div>
  );

  if (!course) return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
              <Button onClick={() => navigate('/courses')} variant="outline">Browse Courses</Button>
          </div>
      </div>
  );

  const effectivePrice = selectedBatch?.batchPrice > 0 ? selectedBatch.batchPrice : course.price;

  return (
    <PageTransition className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 pb-32">
       
       {/* Cinematic Hero Section */}
       <div className="relative h-[500px] w-full overflow-hidden">
            <div className="absolute inset-0">
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-60 blur-sm scale-105" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
                 <Button 
                    variant="ghost" 
                    className="absolute top-8 left-6 text-white/80 hover:text-white hover:bg-white/10 w-fit" 
                    onClick={() => navigate('/courses')}
                 >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                 </Button>

                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                 >
                     <div className="flex gap-2 mb-4">
                         <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{course.category}</span>
                         <span className="bg-white/10 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                             <Clock className="h-3 w-3" /> {course.level}
                         </span>
                     </div>
                     <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight max-w-4xl">
                         {course.title}
                     </h1>
                     <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed mb-6">
                         {course.description}
                     </p>
                     
                     <div className="flex flex-wrap gap-6 text-sm text-slate-400 font-medium">
                         <div className="flex items-center gap-2">
                             <Users className="h-5 w-5 text-indigo-400" />
                             <span>{course.studentsEnrolled || 0} Learners</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <Globe className="h-5 w-5 text-indigo-400" />
                             <span>{course.language}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <Award className="h-5 w-5 text-indigo-400" />
                             <span>Certificate of Completion</span>
                         </div>
                     </div>
                 </motion.div>
            </div>
       </div>

       <div className="max-w-7xl mx-auto px-6 mt-8 grid lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">

                {/* Available Batches Section */}
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-orange-400" />
                        Available Batches
                    </h3>
                    
                    {batchesLoading ? (
                        <SkeletonLoader count={2} className="h-32" type="card" />
                    ) : batches.length > 0 ? (
                        <div className="space-y-4">
                            {batches.map((batch, idx) => {
                                const isSelected = selectedBatchId === batch._id;
                                const batchPrice = batch.batchPrice > 0 ? batch.batchPrice : course.price;
                                return (
                                    <motion.div
                                        key={batch._id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setSelectedBatchId(batch._id)}
                                        className={`
                                            relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300
                                            ${isSelected 
                                                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'}
                                        `}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-3 right-3">
                                                <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-lg font-bold text-white">{batch.name}</h4>
                                                {batch.description && (
                                                    <p className="text-sm text-slate-400 line-clamp-2">{batch.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-indigo-400" />
                                                        {new Date(batch.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {batch.endDate && ` — ${new Date(batch.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3 text-emerald-400" />
                                                        {batch.currentEnrollment || 0}/{batch.maxStudents} seats
                                                    </span>
                                                    {batch.classSchedule?.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-orange-400" />
                                                            {batch.classSchedule.map(s => s.day.slice(0, 3)).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xl font-bold text-white">
                                                    {batchPrice === 0 ? 'Free' : `₹${batchPrice}`}
                                                </p>
                                                <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                                                    batch.enrollmentType === 'open' 
                                                        ? 'bg-emerald-500/10 text-emerald-400' 
                                                        : 'bg-orange-500/10 text-orange-400'
                                                }`}>
                                                    {batch.enrollmentType}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                            <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">No batches available yet. Check back soon!</p>
                        </div>
                    )}
                </section>
                
                {/* What you'll learn */}
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-emerald-400" /> 
                        What You'll Learn
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {course.whatYouWillLearn?.length > 0 ? (
                            course.whatYouWillLearn.map((item, i) => (
                                <div key={i} className="flex gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-slate-500 italic">Curriculum details currently being updated.</div>
                        )}
                    </div>
                </section>

                {/* Course Content Accordion */}
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-indigo-400" /> 
                        Curriculum
                    </h3>
                    <div className="space-y-4">
                        {['Introduction & Basics', 'Core Concepts', 'Advanced Techniques', 'Final Project'].map((module, idx) => (
                             <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
                                 <button 
                                    onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors"
                                 >
                                     <div className="flex items-center gap-4">
                                         <span className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-700">
                                             {idx + 1}
                                         </span>
                                         <span className="font-semibold text-white">{module}</span>
                                     </div>
                                     {activeAccordion === idx ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                 </button>
                                 
                                 <AnimatePresence>
                                     {activeAccordion === idx && (
                                         <motion.div 
                                            initial={{ height: 0 }} 
                                            animate={{ height: 'auto' }} 
                                            exit={{ height: 0 }} 
                                            className="overflow-hidden"
                                         >
                                             <div className="p-5 pt-0 border-t border-slate-800/50 space-y-3">
                                                 {[1, 2, 3].map((lesson) => (
                                                     <div key={lesson} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-slate-400 text-sm">
                                                         <PlayCircle className="h-4 w-4 text-indigo-500" />
                                                         <span>Module {idx + 1}.{lesson}: Lesson Title Placeholder</span>
                                                         <span className="ml-auto text-xs opacity-50">10:00</span>
                                                     </div>
                                                 ))}
                                             </div>
                                         </motion.div>
                                     )}
                                 </AnimatePresence>
                             </div>
                        ))}
                    </div>
                </section>
                
                {/* Trainer Bio */}
                <section>
                     <h3 className="text-2xl font-bold text-white mb-6">Your Instructor</h3>
                     <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500/30 transition-all" onClick={() => navigate(`/trainer/${course.trainer?._id}`)}>
                         <div className="shrink-0">
                             <div className="h-24 w-24 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden border-2 border-indigo-500/50">
                                 {course.trainer?.profileImage ? (
                                    <img src={course.trainer.profileImage} alt={course.trainer.name} className="w-full h-full object-cover" />
                                 ) : (
                                    <span className="text-2xl font-bold text-indigo-400">{course.trainer?.name?.[0]}</span>
                                 )}
                             </div>
                         </div>
                         <div>
                             <h4 className="text-xl font-bold text-white mb-1">{course.trainer?.name}</h4>
                             <p className="text-indigo-400 text-sm font-medium mb-3">Senior Tech Instructor</p>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                 {course.trainer?.bio || "Passionate educator with years of industry experience. Dedicated to helping students master complex concepts through practical, hands-on learning."}
                             </p>
                         </div>
                     </div>
                </section>

            </div>

            {/* Sidebar Sticky / Floating */}
            <div className="lg:col-span-1">
                 <div className="sticky top-24 space-y-6">
                     <Card className="bg-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-900/20 overflow-hidden">
                         <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                         <CardContent className="p-8 space-y-6">
                             <div className="text-center">
                                 <span className="text-slate-400 text-sm uppercase font-bold tracking-wider">
                                     {selectedBatch ? 'Batch Fee' : 'Course Fee'}
                                 </span>
                                 <div className="text-4xl font-extrabold text-white mt-2">
                                     {effectivePrice === 0 ? "Free" : `₹${effectivePrice}`}
                                 </div>
                                 {selectedBatch && (
                                     <p className="text-indigo-400 text-xs mt-2 font-medium">{selectedBatch.name}</p>
                                 )}
                                 <p className="text-slate-500 text-xs mt-1">One-time payment • Lifetime access</p>
                             </div>
                             
                             <Button 
                                className={`w-full h-12 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] ${
                                    isEnrolled
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                                        : !selectedBatchId
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                                }`}
                                onClick={handleEnroll}
                                disabled={!isEnrolled && !selectedBatchId}
                             >
                                 {isEnrolled ? (
                                     <span className="flex items-center justify-center gap-2">Go to Classroom <ArrowLeft className="h-4 w-4 rotate-180" /></span>
                                 ) : !selectedBatchId ? (
                                     'Select a Batch First'
                                 ) : (
                                     effectivePrice === 0 ? 'Enroll for Free' : 'Enroll Now'
                                 )}
                             </Button>

                             <div className="space-y-3 pt-4 border-t border-slate-800">
                                 <div className="flex items-center gap-3 text-sm text-slate-300">
                                     <Shield className="h-4 w-4 text-emerald-400" />
                                     <span>30-Day Money-Back Guarantee</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-sm text-slate-300">
                                     <Video className="h-4 w-4 text-indigo-400" />
                                     <span>High Quality Video Lessons</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-sm text-slate-300">
                                     <Globe className="h-4 w-4 text-sky-400" />
                                     <span>Access on Mobile & Web</span>
                                 </div>
                             </div>
                         </CardContent>
                     </Card>
                 </div>
            </div>
       </div>

       {/* Mobile Sticky Enroll Bar */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 lg:hidden flex items-center justify-between z-50 animate-in slide-in-from-bottom">
            <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Total</p>
                <p className="text-xl font-bold text-white">{effectivePrice === 0 ? "Free" : `₹${effectivePrice}`}</p>
            </div>
            <Button 
                className={`px-8 ${isEnrolled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                onClick={handleEnroll}
                disabled={!isEnrolled && !selectedBatchId}
            >
                {isEnrolled ? 'Go to Class' : !selectedBatchId ? 'Select Batch' : 'Enroll Now'}
            </Button>
       </div>

    </PageTransition>
  );
};

export default CourseDetails;
