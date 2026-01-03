import { useAuth } from '../../context/AuthContext';
import { BookOpen, Video, Calendar, ArrowRight, Sparkles, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button'; 

const StudentDashboard = () => {
    const { user } = useAuth();

    // Mock data
    const stats = [
        { 
            title: 'Enrolled Courses', 
            value: '0', 
            icon: BookOpen, 
            color: 'text-blue-600 dark:text-blue-400', 
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            border: 'hover:border-blue-500/50'
        },
        { 
            title: 'Upcoming Classes', 
            value: '0', 
            icon: Video, 
            color: 'text-purple-600 dark:text-purple-400', 
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            border: 'hover:border-purple-500/50'
        },
        { 
            title: 'Pending Assignments', 
            value: '0', 
            icon: Calendar, 
            color: 'text-orange-600 dark:text-orange-400', 
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            border: 'hover:border-orange-500/50'
        },
    ];

    return (
        // Added 'w-full' and maintained padding
        <div className="w-full space-y-8 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-[calc(100vh-60px)]">
            
            {/* Header Section */}
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                            Welcome back, <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">{user?.name}</span>
                            <Sparkles className="inline-block w-6 h-6 ml-2 text-yellow-500 mb-2" />
                        </h1>
                        <p className="text-muted-foreground text-lg mt-1">
                            Ready to learn something new today? Here is your daily digest.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <Button className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900">
                            Browse Courses
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card 
                        key={index} 
                        className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${stat.border} group`}
                    >
                        <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${stat.bg.replace('/10', '/30')}`} />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-3 rounded-xl transition-colors duration-300 ${stat.bg}`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="z-10">
                            <div className="text-4xl font-bold tracking-tight mt-2">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <span className="text-emerald-500 font-medium">+0%</span> from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                
                {/* My Courses Section */}
                <Card className="col-span-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="text-xl">My Courses</CardTitle>
                        <CardDescription>Continue where you left off</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 transition-colors">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">No courses enrolled</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                                You haven't started any courses yet. Explore our library to find something amazing.
                            </p>
                            <Button variant="outline" className="gap-2 group">
                                Explore Library 
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Live Sessions Section */}
                <Card className="col-span-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                     <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Live Sessions</CardTitle>
                            <CardDescription>Upcoming schedule</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center h-[280px]">
                            <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full mb-4 animate-pulse">
                                <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white">No upcoming sessions</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your schedule is clear for now.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;