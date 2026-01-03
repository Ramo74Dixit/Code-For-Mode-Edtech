import React, { useEffect, useState } from 'react';
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
  const { isTrainer } = useAuth();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data.data);
      } catch (error) {
        console.error('Failed to fetch course', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

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
                        
                        <Button className="w-full" size="lg">
                             Enroll Now
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
                    <CardContent className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {course.trainer?.name?.[0] || 'T'}
                        </div>
                        <div>
                            <div className="font-medium">{course.trainer?.name || 'Trainer Name'}</div>
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
