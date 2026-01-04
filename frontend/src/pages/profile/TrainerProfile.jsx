import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MapPin, Globe, Linkedin, Github, Twitter, BookOpen, Users, Award } from 'lucide-react';
import api from '../../services/api';

const TrainerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/auth/${id}/profile`);
                if (res.data.success) {
                    setProfile(res.data.data.user);
                    setCourses(res.data.data.courses);
                }
            } catch (err) {
                console.error("Failed to fetch trainer profile", err);
                setError(err.response?.data?.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProfile();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
    
    if (error || !profile) {
        return (
            <div className="p-10 text-center space-y-4">
                <p className="text-red-500 font-medium">{error || "User not found"}</p>
                 <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Back Button */}
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            {/* Profile Header */}
            <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5"></div>
                <CardContent className="relative px-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                         {/* Avatar */}
                         <div className="h-32 w-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-muted-foreground">{profile.name?.[0]}</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-2 pt-12 md:pt-0 md:mt-14">
                            <div>
                                <h1 className="text-3xl font-bold">{profile.name}</h1>
                                <p className="text-lg text-muted-foreground">{profile.headline || "Instructor at CodeForMode"}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {profile.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {courses.length > 0 ? `${courses.length} Courses Published` : 'New Instructor'}
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-2 pt-12 md:pt-0 md:mt-14">
                            {profile.socialLinks?.website && (
                                <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Globe className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                            {profile.socialLinks?.linkedin && (
                                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Linkedin className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                             {profile.socialLinks?.github && (
                                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Github className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                             {profile.socialLinks?.twitter && (
                                <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Twitter className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Left Column: About & Skills */}
                <div className="md:col-span-2 space-y-8">
                    {/* About Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="p-1 bg-primary/10 rounded-md"><BookOpen className="h-5 w-5 text-primary"/></span>
                            About
                        </h2>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                            {profile.bio ? (
                                <p className="whitespace-pre-wrap">{profile.bio}</p>
                            ) : (
                                <p className="italic">No bio available.</p>
                            )}
                        </div>
                    </div>

                    {/* Skills Section */}
                    {profile.skills?.length > 0 && (
                         <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="p-1 bg-primary/10 rounded-md"><Award className="h-5 w-5 text-primary"/></span>
                                Skills & Expertise
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Courses */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold">Courses by {profile.name.split(' ')[0]}</h2>
                    {courses.length > 0 ? (
                        <div className="grid gap-4">
                            {courses.map(course => (
                                <Card key={course._id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/courses/${course.slug}`)}>
                                    <div className="aspect-video w-full bg-muted relative">
                                        {course.thumbnail && (
                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                                            {course.price === 0 ? 'FREE' : `₹${course.price}`}
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold line-clamp-1 mb-1">{course.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="capitalize">{course.level}</span>
                                            <span>{course.language}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No active courses found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerProfile;
