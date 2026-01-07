import React, { useEffect, useState } from 'react';
import { useRazorpay } from 'react-razorpay';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, BookOpen, Clock, Users, Globe, CheckCircle, Shield, Award, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isTrainer, user } = useAuth();
  const { Razorpay } = useRazorpay();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, enrollRes] = await Promise.all([
             api.get(`/courses/${id}`),
             api.get('/enrollments') 
        ]);
        
        setCourse(courseRes.data.data);
        const enrolled = enrollRes.data.data.some(e => e.course._id === id);
        setIsEnrolled(enrolled);

      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleEnroll = async () => {
      if (!user) {
          alert('Please login to enroll');
          return;
      }

      if (isEnrolled) {
          navigate('/batches');
          return;
      }

      try {
          if (course.price === 0) {
               await api.post(`/enrollments/${id}`);
               alert('Enrolled Successfully!');
               navigate('/batches'); // Corrected redirect
               return;
          }

          const orderRes = await api.post('/payment/create-order', { courseId: id });
          const order = orderRes.data.data;

          const options = {
              key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
              amount: order.amount,
              currency: order.currency,
              name: "Code For Mode EdTech",
              description: `Enrollment for ${course.title}`,
              order_id: order.id,
              handler: async function (response) {
                  try {
                      const verifyRes = await api.post('/payment/verify-payment', {
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          courseId: id
                      });

                      if (verifyRes.data.success) {
                          alert('Payment Successful! Welcome to the course. 🎓');
                          navigate('/batches');
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
                        {/* Mock Curriculum Sections - Since backend model doesn't have detailed structure yet, simulating one for UI */}
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
                                 {course.trainer?.bio || "Passionate educator with years of industry experience. Dedicated to helping students maskter complex concepts through practical, hands-on learning."}
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
                                 <span className="text-slate-400 text-sm uppercase font-bold tracking-wider">Course Fee</span>
                                 <div className="text-4xl font-extrabold text-white mt-2">
                                     {course.price === 0 ? "Free" : `₹${course.price}`}
                                 </div>
                                 <p className="text-slate-500 text-xs mt-2">One-time payment • Lifetime access</p>
                             </div>
                             
                             <Button 
                                className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
                                onClick={handleEnroll}
                             >
                                 {isEnrolled ? (
                                     <span className="flex items-center justify-center gap-2">Go to Classroom <ArrowLeft className="h-4 w-4 rotate-180" /></span>
                                 ) : (
                                     course.price === 0 ? 'Enroll for Free' : 'Enroll Now'
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
                <p className="text-xl font-bold text-white">{course.price === 0 ? "Free" : `₹${course.price}`}</p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-500 px-8" onClick={handleEnroll}>
                {isEnrolled ? 'Go to Class' : 'Enroll Now'}
            </Button>
       </div>

    </PageTransition>
  );
};

export default CourseDetails;
