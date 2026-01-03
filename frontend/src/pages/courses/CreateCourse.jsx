import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../services/api';

const CreateCourse = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        level: 'Beginner',
        thumbnail: '',
        language: 'Hindi'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/courses', formData);
            navigate('/courses');
        } catch (error) {
            console.error('Failed to create course', error);
            // Handle error (show toast maybe?)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Course Title</label>
                            <Input
                                name="title"
                                placeholder="e.g. Master React JS"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Detailed description of the course..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Price (₹)</label>
                                <Input
                                    name="price"
                                    type="number"
                                    placeholder="499"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Input
                                    name="category"
                                    placeholder="e.g. Web Development"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Level</label>
                                <select 
                                    name="level"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.level}
                                    onChange={handleChange}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Language</label>
                                <Input
                                    name="language"
                                    placeholder="e.g. English, Hindi"
                                    value={formData.language}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Thumbnail URL</label>
                            <Input
                                name="thumbnail"
                                placeholder="https://example.com/image.jpg"
                                value={formData.thumbnail}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                             <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isLoading}>
                                Create Course
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateCourse;
