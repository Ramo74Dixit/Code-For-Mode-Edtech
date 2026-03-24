import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Calendar, User, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
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
    fetchAnnouncements();
  }, []);

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
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg mb-6">
            {error}
        </div>
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
          <Card key={announcement._id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
             
             {/* Left color bar indicator based on priority */}
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                 announcement.priority === 'high' ? 'bg-red-500' : 
                 announcement.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
             }`}></div>

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

                <div className="prose prose-invert max-w-none text-slate-300 mb-6">
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
        ))}
      </div>
    </div>
  );
};

export default AnnouncementList;
