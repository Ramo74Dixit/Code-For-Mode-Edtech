import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card'; // We might barely use base card, mostly custom div
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, BookOpen, Sparkles, Filter, Code, Database, Globe, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { isTrainer, isAdmin } = useAuth();
  const navigate = useNavigate();

  const canCreateCourse = isTrainer || isAdmin;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setError(null);
      const res = await api.get('/courses');
      setCourses(res.data.data);
    } catch (error) {
      console.error('Failed to fetch courses', error);
      setError("Unable to load courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Web Development', 'Mobile App', 'Data Science', 'UI/UX', 'DevOps'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory || (!course.category && activeCategory === 'All');
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat) => {
      if (!cat) return <Code className="h-4 w-4" />;
      const lower = cat.toLowerCase();
      if (lower.includes('web')) return <Globe className="h-4 w-4" />;
      if (lower.includes('data')) return <Database className="h-4 w-4" />;
      if (lower.includes('ui')) return <Sparkles className="h-4 w-4" />;
      if (lower.includes('mobile')) return <BookOpen className="h-4 w-4" />; // Replace with Phone if available
      return <Brain className="h-4 w-4" />;
  };

  return (
    <PageTransition className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 p-4 md:p-8">
      
       {/* Background Ambience */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]" />
        </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/50">
           <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                  Explore <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Courses</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl">
                  Unlock your potential with our meticulously crafted learning paths.
              </p>
           </div>
           
           {canCreateCourse && (
               <Button onClick={() => navigate('/courses/create')} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20 transition-all rounded-full px-6">
                   <Plus className="mr-2 h-5 w-5" /> Create Course
               </Button>
           )}
        </div>

        {/* Error Message */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-100 p-6 rounded-xl text-center">
                <p className="text-lg font-bold mb-2">Connection Error</p>
                <p className="text-red-300 mb-4">{error}</p>
                <Button variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10" onClick={fetchCourses}>
                    Retry Connection
                </Button>
            </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <Input 
                    type="text"
                    placeholder="Search for courses..."
                    className="pl-10 h-12 bg-slate-900/50 border-slate-800 rounded-xl focus-visible:ring-indigo-500/50 text-slate-200 placeholder:text-slate-500 backdrop-blur-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full no-scrollbar mask-linear-gradient">
                <Filter className="h-5 w-5 text-slate-500 mr-2 flex-shrink-0" />
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border
                            ${activeCategory === cat 
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : 'bg-slate-900/30 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Course Grid */}
        {loading ? (
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <SkeletonLoader type="card" count={8} className="h-[320px]" />
             </div>
        ) : filteredCourses.length === 0 ? (
             <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-10 w-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                    We couldn't find any courses matching "{searchTerm}". Try changing your filters.
                </p>
                <Button variant="link" className="text-indigo-400 mt-4" onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}>
                    Clear Filters
                </Button>
             </div>
        ) : (
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 <AnimatePresence>
                     {filteredCourses.map((course, index) => (
                         <motion.div
                            key={course._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                         >
                             <Link to={`/courses/${course._id}`} className="group block h-full">
                                 <div className="relative h-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group-hover:-translate-y-1">
                                     
                                     {/* Thumbnail Area */}
                                     <div className="relative h-48 overflow-hidden">
                                         {course.thumbnail ? (
                                             <img 
                                                 src={course.thumbnail} 
                                                 alt={course.title} 
                                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                             />
                                         ) : (
                                             <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                                 <BookOpen className="h-12 w-12 text-slate-700" />
                                             </div>
                                         )}
                                         
                                         {/* Overlay Gradient */}
                                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                                         
                                         {/* Floating Badges */}
                                         <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            {course.level && (
                                                <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-md">
                                                    {course.level}
                                                </span>
                                            )}
                                         </div>
                                         <div className="absolute top-3 left-3">
                                             <span className="px-2 py-1 text-xs font-bold bg-indigo-600 text-white rounded-md shadow-lg">
                                                 ₹{course.price}
                                             </span>
                                         </div>
                                     </div>

                                     {/* Content Area */}
                                     <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
                                         {/* Category Badge */}
                                         <div className="flex items-center gap-2 mb-3">
                                             <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                                                 {getCategoryIcon(course.category)}
                                             </div>
                                             <span className="text-xs font-medium text-indigo-300 tracking-wide uppercase">
                                                 {course.category || 'General'}
                                             </span>
                                         </div>

                                         <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                                             {course.title}
                                         </h3>
                                         
                                         <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
                                             {course.description}
                                         </p>

                                         <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-500">
                                             <div className="flex items-center gap-1">
                                                 <Sparkles className="h-3 w-3 text-emerald-400" />
                                                 <span>Best Seller</span>
                                             </div>
                                             <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-indigo-400 font-medium">
                                                 View Details <BookOpen className="h-3 w-3 ml-1" />
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </Link>
                         </motion.div>
                     ))}
                 </AnimatePresence>
             </div>
        )}
      </div>
    </PageTransition>
  );
};

export default CourseList;
