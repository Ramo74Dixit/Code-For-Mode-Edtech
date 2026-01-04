import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import axios from 'axios';

const AddVideoModal = ({ isOpen, onClose, batchId, onVideoAdded }) => {
    const [formData, setFormData] = useState({
        title: '',
        youtubeUrl: '',
        duration: '',
        description: '',
        isUnlisted: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const extractYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const youtubeId = extractYoutubeId(formData.youtubeUrl);
        if (!youtubeId) {
            setError('Invalid YouTube URL');
            setLoading(false);
            return;
        }

        const payload = {
            title: formData.title,
            youtubeId: youtubeId,
            duration: formData.duration,
            description: formData.description,
            isUnlisted: formData.isUnlisted
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:5001/api/batches/${batchId}/videos`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                onVideoAdded(response.data.data);
                onClose();
                setFormData({
                    title: '',
                    youtubeUrl: '',
                    duration: '',
                    description: '',
                    isUnlisted: true
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add video');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Video to Batch">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">{error}</div>}
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Video Title *</label>
                    <Input name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Introduction to React" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube URL *</label>
                    <Input name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} required placeholder="https://youtu.be/..." />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (e.g. 10:30) *</label>
                    <Input name="duration" value={formData.duration} onChange={handleChange} required placeholder="MM:SS" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea 
                        name="description" 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formData.description} 
                        onChange={handleChange}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id="isUnlisted" 
                        name="isUnlisted" 
                        checked={formData.isUnlisted} 
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isUnlisted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Mark as Unlisted (Private to Batch)
                    </label>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Video'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddVideoModal;
