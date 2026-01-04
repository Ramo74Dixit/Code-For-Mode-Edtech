import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Edit, Upload, FileText, Github, Linkedin, Globe, MapPin, Phone, Briefcase, Mail } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
      name: '',
      headline: '',
      bio: '',
      location: '',
      phoneNumber: '',
      github: '',
      linkedin: '',
      website: '',
      skills: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
        const res = await api.get('/auth/me');
        const p = res.data.data;
        setProfile(p);
        setFormData({
            name: p.name || '',
            headline: p.headline || '',
            bio: p.bio || '',
            location: p.location || '',
            phoneNumber: p.phoneNumber || '',
            github: p.socialLinks?.github || '',
            linkedin: p.socialLinks?.linkedin || '',
            website: p.socialLinks?.website || '',
            skills: p.skills ? p.skills.join(', ') : ''
        });
    } catch (error) {
        console.error('Failed to fetch profile', error);
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
      try {
          const payload = {
              ...formData,
              socialLinks: {
                  github: formData.github,
                  linkedin: formData.linkedin,
                  website: formData.website
              },
              skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
          };
          
          const res = await api.put('/auth/updatedetails', payload);
          setProfile(res.data.data); // Update profile directly from response
          setIsEditing(false);
          // fetchProfile(); // No need to refetch if we trust the response
      } catch (error) {
          console.error('Failed to update', error);
          alert('Failed to update profile');
      }
  };

  const handleFileUpload = async (e, type) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append(type, file);

      try {
          const res = await api.post(`/upload/${type}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          // For file uploads, better to refetch to get updated URLs if they change structure
          // Or update partially
          if (type === 'avatar') {
             setProfile(prev => ({ ...prev, profileImage: res.data.data }));
          } else {
             setProfile(prev => ({ ...prev, resume: res.data.data }));
          }
      } catch (error) {
           console.error('Upload failed', error);
           alert('Upload failed');
      }
  };

  const formatUrl = (url) => {
      if (!url) return '#';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `https://${url}`;
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-muted-foreground">Loading profile...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-8">
        
        {/* Header Card - Improved Design */}
        <div className="relative mb-20 group">
            <div className="h-48 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 rounded-2xl w-full shadow-lg"></div>
            
            {/* Action Bar */}
             <div className="absolute top-4 right-4 z-10">
                 {!isEditing ? (
                     <Button variant="secondary" onClick={() => setIsEditing(true)} className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border-0 shadow-sm">
                         <Edit className="h-4 w-4 mr-2" />
                         Edit Profile
                     </Button>
                 ) : (
                     <div className="flex gap-2 p-2 bg-background/80 backdrop-blur-md rounded-lg shadow-lg border">
                         <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                         <Button onClick={handleUpdate} className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
                     </div>
                 )}
            </div>

            <div className="absolute -bottom-16 left-8 flex flex-col md:flex-row items-end md:items-end gap-6 w-full pr-8">
                <div className="relative group/avatar">
                    <Avatar className="h-32 w-32 border-[6px] border-background shadow-2xl bg-white">
                        <AvatarImage src={profile?.profileImage} className="object-cover" />
                        <AvatarFallback className="text-4xl font-bold text-primary">{profile?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover/avatar:opacity-100 rounded-full cursor-pointer transition-all duration-300">
                        <Upload className="h-8 w-8" />
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} accept="image/*" />
                    </label>
                </div>
                
                <div className="mb-2 flex-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{profile?.name}</h1>
                    <p className="text-lg text-muted-foreground font-medium flex items-center gap-2 mt-1">
                        {profile?.headline ? (
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                                {profile.headline}
                            </span>
                        ) : (
                            <span className="text-muted-foreground italic">Add a professional headline</span>
                        )}
                    </p>
                </div>
            </div>
        </div>

        <div className="grid gap-8 md:grid-cols-12 pt-8">
            {/* Sidebar (Left Column) */}
            <div className="md:col-span-4 space-y-6">
                <Card className="border-muted/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Contact & Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 text-sm group">
                            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Location</p>
                                {isEditing ? <Input name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Country" className="h-8 mt-1" /> : (
                                    <p className="font-medium truncate">{profile?.location || 'Not specified'}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</p>
                                {isEditing ? <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+91 99999..." className="h-8 mt-1" /> : (
                                    <p className="font-medium truncate">{profile?.phoneNumber || 'Not specified'}</p>
                                )}
                            </div>
                        </div>

                         <div className="flex items-center gap-3 text-sm">
                             <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                <Mail className="h-4 w-4" />
                             </div>
                             <div className="flex-1">
                                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</p>
                                 <p className="font-medium truncate" title={profile?.email}>{profile?.email}</p>
                             </div>
                        </div>

                         <div className="flex items-center gap-3 text-sm">
                             <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600">
                                 <Globe className="h-4 w-4" />
                             </div>
                             <div className="flex-1">
                                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Website</p>
                                 {isEditing ? <Input name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." className="h-8 mt-1" /> : (
                                     profile?.socialLinks?.website ? (
                                        <a href={formatUrl(profile.socialLinks.website)} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium truncate block">
                                            {profile.socialLinks.website.replace(/^https?:\/\//, '')}
                                        </a>
                                     ) : <span className="text-muted-foreground">Not specified</span>
                                 )}
                             </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-muted/60 shadow-sm">
                    <CardHeader className="bg-muted/30 pb-4">
                         <CardTitle className="text-lg font-semibold flex items-center gap-2">
                             <Globe className="h-5 w-5 text-primary" />
                             Social Profiles
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                         <div className="flex items-center gap-3">
                             <Github className="h-5 w-5" />
                              {isEditing ? <Input name="github" value={formData.github} onChange={handleInputChange} placeholder="github.com/username" /> : (
                                  profile?.socialLinks?.github ? (
                                      <a href={formatUrl(profile.socialLinks.github)} target="_blank" rel="noreferrer" className="flex-1 text-sm font-medium hover:text-primary transition-colors truncate">
                                          {profile.socialLinks.github}
                                      </a>
                                  ) : <span className="text-muted-foreground text-sm flex-1">Not connected</span>
                              )}
                         </div>
                         <div className="flex items-center gap-3">
                             <Linkedin className="h-5 w-5 text-blue-700" />
                              {isEditing ? <Input name="linkedin" value={formData.linkedin} onChange={handleInputChange} placeholder="linkedin.com/in/username" /> : (
                                  profile?.socialLinks?.linkedin ? (
                                      <a href={formatUrl(profile.socialLinks.linkedin)} target="_blank" rel="noreferrer" className="flex-1 text-sm font-medium hover:text-primary transition-colors truncate">
                                          {profile.socialLinks.linkedin}
                                      </a>
                                  ) : <span className="text-muted-foreground text-sm flex-1">Not connected</span>
                              )}
                         </div>
                    </CardContent>
                </Card>

                <Card className="border-muted/60 shadow-sm bg-gradient-to-br from-background to-muted/20">
                     <CardHeader>
                         <CardTitle className="text-lg font-semibold">Resume</CardTitle>
                     </CardHeader>
                     <CardContent>
                         {profile?.resume ? (
                             <div className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm group hover:border-primary/50 transition-colors">
                                 <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                                         <FileText className="h-5 w-5 text-red-600" />
                                     </div>
                                     <div className="text-sm overflow-hidden">
                                         <div className="font-semibold truncate">My_Resume.pdf</div>
                                         <a href={profile.resume} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline font-medium">Click to View</a>
                                     </div>
                                 </div>
                             </div>
                         ) : (
                             <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-lg mb-2">No resume uploaded</div>
                         )}
                         <div className="mt-4">
                             <label className={`flex items-center justify-center w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-95 ${profile?.resume ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'}`}>
                                 <Upload className="h-4 w-4 mr-2" />
                                 <span className="text-sm font-medium">{profile?.resume ? 'Update Resume' : 'Upload Resume'}</span>
                                 <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'resume')} />
                             </label>
                         </div>
                     </CardContent>
                </Card>
            </div>

            {/* Main Content (Right Column) */}
            <div className="md:col-span-8 space-y-8">
                 {isEditing && (
                     <Card className="border-primary/50 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                         <CardHeader className="bg-primary/5 pb-4">
                             <CardTitle className="text-primary flex items-center gap-2">
                                 <Edit className="h-5 w-5" />
                                 Edit Basic Info
                             </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4 pt-6">
                             <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                     <label className="text-sm font-semibold text-foreground">Full Name</label>
                                     <Input name="name" value={formData.name} onChange={handleInputChange} className="font-medium" />
                                 </div>
                                 <div className="grid gap-2">
                                     <label className="text-sm font-semibold text-foreground">Professional Headline</label>
                                     <Input name="headline" value={formData.headline} onChange={handleInputChange} placeholder="Software Engineer | Student" />
                                 </div>
                             </div>
                         </CardContent>
                     </Card>
                 )}

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl">About Me</CardTitle>
                        {!isEditing && !profile?.bio && <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-primary h-8">Add Bio</Button>}
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <Textarea 
                                name="bio" 
                                value={formData.bio} 
                                onChange={handleInputChange} 
                                placeholder="Write a short professional bio..." 
                                className="min-h-[150px] resize-y"
                            />
                        ) : (
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {profile?.bio || <span className="italic opacity-50">No bio added yet. Tell us about yourself!</span>}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl">Skills & Expertise</CardTitle>
                        {!isEditing && (!profile?.skills || profile.skills.length === 0) && <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-primary h-8">Add Skills</Button>}
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <label className="text-sm font-medium mb-2 block">Skills (Comma separated)</label>
                                <Input 
                                    name="skills" 
                                    value={formData.skills} 
                                    onChange={handleInputChange} 
                                    placeholder="React, Node.js, Python, Design..." 
                                    className="bg-background"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {formData.skills.split(',').filter(s => s.trim()).map((skill, i) => (
                                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile?.skills?.length > 0 ? (
                                    profile.skills.map((skill, index) => (
                                        <div key={index} className="px-4 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full text-sm font-medium transition-colors cursor-default border border-transparent hover:border-muted-foreground/20">
                                            {skill}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground italic">No skills added</span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
};

export default Profile;
