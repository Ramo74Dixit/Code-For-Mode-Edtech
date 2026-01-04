import React, { useEffect, useState } from 'react';
import { useRazorpay } from 'react-razorpay';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, BookOpen, Clock, Users, Globe } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isTrainer, user } = useAuth(); // Destructure user for email/name prefill if needed
  const { Razorpay } = useRazorpay();
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, enrollRes] = await Promise.all([
             api.get(`/courses/${id}`),
             api.get('/enrollments') 
        ]);
        
        setCourse(courseRes.data.data);
        
        // Check if enrolled
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

      // If already enrolled, go to batches
      if (isEnrolled) {
          navigate('/batches');
          return;
      }

      try {
          if (course.price === 0) {
              // Free Course Enrollment Logic (Direct Enroll)
               await api.post(`/enrollments/${id}`); // Assuming existing endpoint works for free
               alert('Enrolled Successfully!');
               navigate('/');
               return;
          }

          // 1. Create Order
          const orderRes = await api.post('/payments/create-order', { courseId: id });
          const { order } = orderRes.data;

          // Handle Mock Order for testing
          if (order.id.startsWith('order_mock_')) {
              const verifyRes = await api.post('/payments/verify', {
                  razorpay_order_id: order.id,
                  razorpay_payment_id: `pay_mock_${Date.now()}`,
                  razorpay_signature: 'mock_signature',
                  courseId: id
              });

              if (verifyRes.data.success) {
                  alert('Mock Payment Successful & Enrolled!');
                  navigate('/'); 
                  return;
              }
          }

          const options = {
              key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use env var for key
              amount: order.amount,
              currency: order.currency,
              name: "EdTech Platform",
              description: `Enrollment for ${course.title}`,
              order_id: order.id,
              handler: async function (response) {
                  // 2. Verify Payment
                  try {
                      const verifyRes = await api.post('/payments/verify', {
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          courseId: id
                      });

                      if (verifyRes.data.success) {
                          alert('Payment Successful & Enrolled!');
                          navigate('/'); // Redirect to Dashboard or Batches
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
                  contact: user.mobile || '' // Assuming mobile field exists
              },
              theme: {
                  color: "#3399cc"
              }
          };

          const rzp1 = new Razorpay(options);
          rzp1.open();

      } catch (error) {
          console.error('Enrollment Error', error);
          alert('Failed to initiate enrollment');
      }
  };

  if (loading) return <div className="p-10 text-center">Loading details...</div>;
  if (!course) return <div className="p-10 text-center">Course not found</div>;

  return (
    <div className="space-y-6">
       <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
       </Button>

       <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-secondary/50">
                            <BookOpen className="h-16 w-16 opacity-20" />
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">{course.description}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>What you'll learn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            {course.whatYouWillLearn?.length > 0 ? (
                                course.whatYouWillLearn.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))
                            ) : (
                                <li>Comprehensive curriculum (Details coming soon)</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Stats/Action */}
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="text-3xl font-bold text-primary">₹{course.price}</div>
                        
                        <Button className="w-full" size="lg" onClick={handleEnroll}>
                             {isEnrolled ? 'Go to Batches' : (course.price === 0 ? 'Enroll for Free' : 'Enroll Now')}
                        </Button>
                        
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-3 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{course.studentsEnrolled || 0} students enrolled</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>Language: {course.language}</span>
                            </div>
                             <div className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Level: {course.level}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Trainer Info (Mock for now if populate missing) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Instructor</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/trainer/${course.trainer?._id}`)}>
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden">
                            {course.trainer?.profileImage ? (
                                <img src={course.trainer.profileImage} alt={course.trainer.name} className="w-full h-full object-cover" />
                            ) : (
                                course.trainer?.name?.[0] || 'T'
                            )}
                        </div>
                        <div>
                            <div className="font-medium hover:underline">{course.trainer?.name || 'Trainer Name'}</div>
                            <div className="text-xs text-muted-foreground">Expert Instructor</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
       </div>
    </div>
  );
};

export default CourseDetails;
