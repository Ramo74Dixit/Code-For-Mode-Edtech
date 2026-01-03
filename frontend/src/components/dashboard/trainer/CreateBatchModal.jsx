import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Plus, X } from 'lucide-react';
import axios from 'axios';

const CreateBatchModal = ({ isOpen, onClose, onBatchCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        course: '', // ID
        batchPrice: '',
        startDate: '',
        endDate: '',
        maxStudents: '',
        enrollmentType: 'open',
        classSchedule: []
    });
    
    // Schedule Item State
    const [scheduleItem, setScheduleItem] = useState({
        day: 'Monday',
        startTime: '',
        endTime: ''
    });

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchCourses();
        }
    }, [isOpen]);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5001/api/courses/trainer/my-courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data.data || []);
            if (response.data.data.length > 0 && !formData.course) {
                setFormData(prev => ({ ...prev, course: response.data.data[0]._id }));
            }
        } catch (err) {
            console.error("Failed to fetch courses", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addScheduleItem = () => {
        if (!scheduleItem.startTime || !scheduleItem.endTime) return;
        setFormData(prev => ({
            ...prev,
            classSchedule: [...prev.classSchedule, scheduleItem]
        }));
        setScheduleItem({ day: 'Monday', startTime: '', endTime: '' });
    };

    const removeScheduleItem = (index) => {
        setFormData(prev => ({
            ...prev,
            classSchedule: prev.classSchedule.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5001/api/batches', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                onBatchCreated(response.data.data);
                onClose();
                setFormData({
                    name: '', description: '', course: courses[0]?._id || '', 
                    batchPrice: '', startDate: '', endDate: '', 
                    maxStudents: '', enrollmentType: 'open', classSchedule: []
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create batch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Batch">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                {error && <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">{error}</div>}
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Course *</label>
                    <select 
                        name="course" 
                        value={formData.course} 
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
                        required
                    >
                        <option value="">Select a course</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Batch Name *</label>
                    <Input name="name" placeholder="e.g. Full Stack Batch 1" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description *</label>
                    <textarea 
                        name="description" 
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formData.description} 
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Batch Price (₹)</label>
                        <Input type="number" name="batchPrice" value={formData.batchPrice} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Enrollment Type</label>
                        <select 
                            name="enrollmentType" 
                            value={formData.enrollmentType} 
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
                        >
                            <option value="open">Open</option>
                            <option value="invite-only">Invite Only</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <Input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <Input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                    </div>
                </div>

                {/* Class Schedule UI */}
                <div className="space-y-2 border p-3 rounded-md">
                    <label className="text-sm font-medium">Class Schedule</label>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-xs">Day</label>
                            <select 
                                value={scheduleItem.day}
                                onChange={(e) => setScheduleItem({...scheduleItem, day: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
                            >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs">Start</label>
                            <Input type="time" value={scheduleItem.startTime} onChange={(e) => setScheduleItem({...scheduleItem, startTime: e.target.value})} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs">End</label>
                            <Input type="time" value={scheduleItem.endTime} onChange={(e) => setScheduleItem({...scheduleItem, endTime: e.target.value})} />
                        </div>
                        <Button type="button" size="icon" onClick={addScheduleItem}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    
                    {/* List of schedules */}
                    <div className="space-y-2 mt-2">
                        {formData.classSchedule.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-secondary/20 p-2 rounded text-sm">
                                <span>{item.day}: {item.startTime} - {item.endTime}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeScheduleItem(index)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Max Students</label>
                    <Input type="number" name="maxStudents" value={formData.maxStudents} onChange={handleChange} />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Batch'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateBatchModal;
