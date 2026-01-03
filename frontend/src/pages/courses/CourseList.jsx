import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isTrainer, isAdmin } = useAuth();
  
  const canCreateCourse = isTrainer || isAdmin;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data);
    } catch (error) {
      console.error('Failed to fetch courses', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Courses</h1>
           <p className="text-muted-foreground">Browse and manage learning materials</p>
        </div>
        {canCreateCourse && (
          <Link to="/courses/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search courses..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
           <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
           <h3 className="mt-4 text-lg font-semibold">No courses found</h3>
           <p className="text-muted-foreground">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map((course) => (
            <Link key={course._id} to={`/courses/${course._id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-border/60">
                <div className="aspect-video w-full bg-muted relative">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-secondary text-secondary-foreground">
                      <BookOpen className="h-10 w-10 opacity-20" />
                    </div>
                  )}
                  {course.level && (
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded-md shadow-sm">
                      {course.level}
                    </span>
                  )}
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="line-clamp-1 text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold text-primary">₹{course.price}</span>
                    <span className="text-xs text-muted-foreground">{course.category}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
