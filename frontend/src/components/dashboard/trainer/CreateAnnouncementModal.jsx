import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import Modal from '../../ui/Modal';
import api from '../../../services/api';
import { Megaphone, Loader2 } from 'lucide-react';

const CreateAnnouncementModal = ({ isOpen, onClose, batchId, onAnnouncementCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/batches/${batchId}/announcements`, formData);
            if (onAnnouncementCreated) {
                onAnnouncementCreated(res.data.data);
            }
            onClose();
            setFormData({ title: '', message: '' });
        } catch (error) {
            console.error('Failed to create announcement', error);
            alert(error.response?.data?.message || 'Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Announcement">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Topic / Title</label>
                    <Input 
                        name="title" 
                        placeholder="e.g. Class Rescheduled, Exam Reminder" 
                        value={formData.title} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea 
                        name="message" 
                        placeholder="Write your announcement here..." 
                        value={formData.message} 
                        onChange={handleChange} 
                        className="h-32"
                        required 
                    />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-xs">
                    This announcement will be visible to all students in this batch immediately.
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Announcement
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateAnnouncementModal;
