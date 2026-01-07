import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, BookOpen, GraduationCap, DollarSign, Activity } from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users')
            ]);
            setStats(statsRes.data.data);
            setUsers(usersRes.data.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateRole = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        try {
            await api.put(`/admin/users/${userId}`, { role: newRole });
            fetchData(); // Refresh data
            alert("User role updated successfully.");
        } catch (error) {
            console.error("Failed to update role", error);
            alert("Failed to update role.");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure? This action is IRREVERSIBLE.")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchData();
            alert("User deleted.");
        } catch (error) {
            console.error("Failed to delete user", error);
            alert("Failed to delete user.");
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center">Loading Admin Dashboard...</div>;
    if (!stats) return <div className="p-10 text-center text-red-500">Failed to load data.</div>;

    const { counts, recentUsers } = stats;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Overview of platform performance and management.</p>
                </div>
                <div className="flex bg-muted p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        User Management
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                /* Stats Grid */
                <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{counts.totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+0% from last month (Placeholder)</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.totalUsers}</div>
                            <p className="text-xs text-muted-foreground">
                                {counts.totalStudents} Students, {counts.totalTrainers} Trainers
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.totalCourses}</div>
                            <p className="text-xs text-muted-foreground">Across all categories</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{counts.totalBatches}</div>
                            <p className="text-xs text-muted-foreground">Currently running</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Recent Signups</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {recentUsers.map((user) => (
                                    <div key={user._id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name[0]
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                                user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                user.role === 'trainer' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {user.role}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('users')}>
                                 <Users className="mr-2 h-4 w-4" /> Manage Users
                             </Button>
                        </CardContent>
                    </Card>
                </div>
                </div>
            ) : (
                /* User Management Tab */
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>User Management</CardTitle>
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            className="text-sm border rounded-md px-3 py-1 w-64 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                                                        {user.profileImage ? (
                                                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name[0]
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <select 
                                                    className="p-1 border rounded text-xs bg-background"
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="trainer">Trainer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="p-4 align-middle">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    className="h-8 text-xs"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    disabled={user.role === 'admin'} // Prevent deleting admins for safety mostly
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminDashboard;
