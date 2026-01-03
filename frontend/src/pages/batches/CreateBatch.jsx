import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const CreateBatch = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        course: '',
        description: '',
        startDate: '',
        endDate: '',
        maxStudents: 50,
        batchPrice: 0 // Will default to course price ideally, but manual for now
    });

    useEffect(() => {
        // Fetch trainer's courses to populate dropdown
        const fetchCourses = async () => {
             // Assuming endpoint for trainer's courses exists or we filter
            try {
                const res = await api.get('/courses'); // Ideally /courses/trainer/my-courses
                setCourses(res.data.data);
            } catch (error) {
                console.error('Failed to load courses', error);
            }
        };
        fetchCourses();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/batches', formData);
            navigate('/batches');
        } catch (error) {
            console.error('Failed to create batch', error);
        } finally {
            setIsLoading(false);
        }
    };

    // When course is selected, auto-fill price if possible
    const handleCourseChange = (e) => {
        const courseId = e.target.value;
        const selectedCourse = courses.find(c => c._id === courseId);
        setFormData(prev => ({
            ...prev,
            course: courseId,
            batchPrice: selectedCourse ? selectedCourse.price : prev.batchPrice
        }));
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create New Batch</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Batch Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Select Course</label>
                             <select
                                name="course"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.course}
                                onChange={handleCourseChange}
                                required
                             >
                                <option value="">Select a course...</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>{course.title}</option>
                                ))}
                             </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Batch Name</label>
                            <Input
                                name="name"
                                placeholder="e.g. June 2025 Cohort"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Specific details for this batch..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">End Date</label>
                                <Input
                                    name="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Max Students</label>
                                <Input
                                    name="maxStudents"
                                    type="number"
                                    value={formData.maxStudents}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Batch Price (₹)</label>
                                <Input
                                    name="batchPrice"
                                    type="number"
                                    value={formData.batchPrice}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                             <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isLoading}>
                                Create Batch
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateBatch;
