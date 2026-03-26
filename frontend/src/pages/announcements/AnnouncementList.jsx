import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Calendar, User, FileText, Download, ChevronDown, ChevronRight, BookOpen, Users, Plus, Trash2, Megaphone } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CreateAnnouncementModal from '../../components/dashboard/trainer/CreateAnnouncementModal';

const AnnouncementList = () => {
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trainer state
  const [trainerData, setTrainerData] = useState([]);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedBatches, setExpandedBatches] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isTrainer) {
      fetchTrainerData();
    } else {
      fetchStudentData();
    }
  }, []);

  // Student view
  const fetchStudentData = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      setError("Could not load announcements.");
    } finally {
      setLoading(false);
    }
  };

  // Trainer: grouped by Course → Batch
  const fetchTrainerData = async () => {
    try {
      const [batchesRes, announcementsRes] = await Promise.all([
        api.get('/batches/trainer/my-batches'),
        api.get('/announcements')
      ]);

      const batches = batchesRes.data.data || [];
      const allAnnouncements = announcementsRes.data.data || [];

      // Group announcements by batch ID
      const announcementsByBatch = {};
      allAnnouncements.forEach(a => {
        const batchId = a.batch?._id || a.batch || 'unknown';
        if (!announcementsByBatch[batchId]) announcementsByBatch[batchId] = [];
        announcementsByBatch[batchId].push(a);
      });

      // Group batches by course
      const courseMap = {};
      batches.forEach(batch => {
        const courseId = batch.course?._id || 'unknown';
        const courseTitle = batch.course?.title || 'Untitled Course';
        const courseThumbnail = batch.course?.thumbnail || '';

        if (!courseMap[courseId]) {
          courseMap[courseId] = { courseId, courseTitle, courseThumbnail, batches: [] };
        }
        courseMap[courseId].batches.push({
          ...batch,
          announcements: announcementsByBatch[batch._id] || []
        });
      });

      const grouped = Object.values(courseMap);
      setTrainerData(grouped);

      // Auto-expand first course
      if (grouped.length > 0) {
        setExpandedCourses({ [grouped[0].courseId]: true });
        if (grouped[0].batches.length > 0) {
          setExpandedBatches({ [grouped[0].batches[0]._id]: true });
        }
      }
    } catch (err) {
      console.error("Failed to fetch trainer data:", err);
      setError("Could not load announcements.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const toggleBatch = (batchId) => {
    setExpandedBatches(prev => ({ ...prev, [batchId]: !prev[batchId] }));
  };

  const handleDelete = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${announcementId}`);
      fetchTrainerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  // Announcement card component
  const AnnouncementCard = ({ announcement, showDelete = false }) => (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all group overflow-hidden relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        announcement.priority === 'high' ? 'bg-red-500' : 
        announcement.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
      }`}></div>

      {showDelete && (
        <button
          onClick={() => handleDelete(announcement._id)}
          className="absolute top-3 right-3 z-10 p-2 bg-black/40 hover:bg-rose-500/80 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
          title="Delete Announcement"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <CardContent className="p-6 pl-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                {announcement.batch?.name || 'General'}
              </span>
              {announcement.priority === 'high' && (
                <span className="text-xs font-semibold px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  Urgent
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {announcement.title}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{announcement.trainer?.name}</span>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(announcement.createdAt), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 mb-4">
          <p>{announcement.message}</p>
        </div>

        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800/50">
            {announcement.attachments.map((file, idx) => (
              <Button key={idx} variant="outline" size="sm" className="gap-2 h-9 border-slate-700 hover:bg-slate-800" asChild>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 text-blue-400" />
                  {file.name || 'Attachment'}
                  <Download className="h-3 w-3 opacity-50 ml-1" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <div className="h-8 bg-slate-800/50 rounded w-1/4 animate-pulse mb-6"></div>
        {[1,2,3].map(i => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  // ─── TRAINER VIEW: Course → Batch hierarchy ─────────
  if (isTrainer) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Announcements</h1>
              <p className="text-slate-400">Manage announcements across all courses & batches.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 gap-2 w-fit">
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg mb-6">{error}</div>
        )}

        {trainerData.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No courses with batches found. Create a batch to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trainerData.map(course => {
              const isExpanded = expandedCourses[course.courseId];
              const totalAnnouncements = course.batches.reduce((sum, b) => sum + b.announcements.length, 0);

              return (
                <div key={course.courseId} className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
                  {/* Course Header */}
                  <button
                    onClick={() => toggleCourse(course.courseId)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0">
                      {course.courseThumbnail ? (
                        <img src={course.courseThumbnail} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-white">{course.courseTitle}</h3>
                      <p className="text-xs text-slate-500">{course.batches.length} batch{course.batches.length !== 1 ? 'es' : ''} • {totalAnnouncements} announcement{totalAnnouncements !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-orange-500/10 text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/20">
                        {totalAnnouncements}
                      </span>
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                    </div>
                  </button>

                  {/* Batches */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-800/50"
                      >
                        <div className="p-4 space-y-3">
                          {course.batches.map(batch => {
                            const isBatchExpanded = expandedBatches[batch._id];

                            return (
                              <div key={batch._id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => toggleBatch(batch._id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                >
                                  <Users className="h-4 w-4 text-emerald-400" />
                                  <span className="text-sm font-semibold text-white flex-1 text-left">{batch.name}</span>
                                  <span className="text-xs text-slate-500">{batch.currentEnrollment || 0} students</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${batch.announcements.length > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
                                    {batch.announcements.length}
                                  </span>
                                  {isBatchExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                                </button>

                                <AnimatePresence>
                                  {isBatchExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 space-y-3">
                                        {batch.announcements.length > 0 ? (
                                          batch.announcements.map(a => (
                                            <AnnouncementCard key={a._id} announcement={a} showDelete={true} />
                                          ))
                                        ) : (
                                          <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                            <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                            <p className="text-slate-500 text-sm">No announcements for this batch yet.</p>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <CreateAnnouncementModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            batchId={trainerData[0]?.batches[0]?._id || null}
            onAnnouncementCreated={() => { setShowCreateModal(false); fetchTrainerData(); }} 
          />
        )}
      </div>
    );
  }

  // ─── STUDENT VIEW: Flat list (original) ─────────
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
           <Bell className="h-6 w-6" />
        </div>
        <div>
           <h1 className="text-3xl font-bold text-white">Announcements</h1>
           <p className="text-slate-400">Stay updated with latest news from your batches.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg mb-6">{error}</div>
      )}

      {!loading && announcements.length === 0 && !error && (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300">No Announcements Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
                All important updates regarding your classes and schedules will appear here.
            </p>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <AnnouncementCard key={announcement._id} announcement={announcement} />
        ))}
      </div>
    </div>
  );
};

export default AnnouncementList;
