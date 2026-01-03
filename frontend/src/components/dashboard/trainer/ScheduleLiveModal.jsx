import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import axios from 'axios';

const ScheduleLiveModal = ({ isOpen, onClose, onSessionScheduled }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        batch: '', // batchId
        youtubeStreamKey: '',
        youtubeLiveUrl: '',
        startDateTime: '', // Temporary for UI
        duration: 60
    });
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchBatches();
        }
    }, [isOpen]);

    const fetchBatches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5001/api/batches/trainer/my-batches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatches(response.data.data);
            if (response.data.data.length > 0 && !formData.batch) {
                setFormData(prev => ({ ...prev, batch: response.data.data[0]._id }));
            }
        } catch (err) {
            console.error("Failed to fetch batches", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const startTime = new Date(formData.startDateTime);
        const endTime = new Date(startTime.getTime() + formData.duration * 60000);

        const payload = {
            title: formData.title,
            description: formData.description,
            batch: formData.batch,
            youtubeStreamKey: formData.youtubeStreamKey,
            youtubeLiveUrl: formData.youtubeLiveUrl,
            scheduledStartTime: startTime.toISOString(),
            scheduledEndTime: endTime.toISOString()
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5001/api/live-sessions', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                onSessionScheduled(response.data.data);
                onClose();
                setFormData({ 
                    title: '', description: '', batch: batches[0]?._id || '', 
                    youtubeStreamKey: '', youtubeLiveUrl: '', 
                    startDateTime: '', duration: 60 
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to schedule session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Live Class">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">{error}</div>}
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Session Title</label>
                    <Input name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Weekly Q&A" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Batch</label>
                    <select 
                        name="batch" 
                        value={formData.batch} 
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                    >
                        <option value="">Select a batch</option>
                        {batches.map(batch => (
                            <option key={batch._id} value={batch._id}>{batch.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube Live URL</label>
                    <Input name="youtubeLiveUrl" value={formData.youtubeLiveUrl} onChange={handleChange} required placeholder="https://youtube.com/live/..." />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Stream Key</label>
                    <Input name="youtubeStreamKey" type="password" value={formData.youtubeStreamKey} onChange={handleChange} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Time</label>
                        <Input type="datetime-local" name="startDateTime" value={formData.startDateTime} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Duration (mins)</label>
                        <Input type="number" name="duration" value={formData.duration} onChange={handleChange} required />
                    </div>
                </div>

                 <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea 
                        name="description" 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formData.description} 
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Scheduling...' : 'Schedule Class'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleLiveModal;
