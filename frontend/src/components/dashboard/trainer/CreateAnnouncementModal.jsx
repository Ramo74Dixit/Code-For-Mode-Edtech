import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import Modal from '../../ui/Modal';
import api from '../../../services/api';
import { Megaphone, Loader2, Paperclip, X, FileText, Image } from 'lucide-react';

const CreateAnnouncementModal = ({ isOpen, onClose, batchId, onAnnouncementCreated }) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: ''
    });
    const [attachments, setAttachments] = useState([]); // [{ name, url, type }]

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            for (const file of files) {
                const uploadData = new FormData();
                uploadData.append('resource', file);
                
                const res = await api.post('/upload/resource', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setAttachments(prev => [...prev, {
                    name: file.name,
                    url: res.data.data,
                    type: file.type.startsWith('image') ? 'image' : 
                          file.type === 'application/pdf' ? 'pdf' : 'file'
                }]);
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('File upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/batches/${batchId}/announcements`, {
                ...formData,
                attachments
            });
            if (onAnnouncementCreated) {
                onAnnouncementCreated(res.data.data);
            }
            onClose();
            setFormData({ title: '', message: '' });
            setAttachments([]);
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

                {/* File Upload Section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments (Optional)</label>
                    
                    {/* Attached files list */}
                    {attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm">
                                    {file.type === 'image' ? (
                                        <Image className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                    )}
                                    <span className="flex-1 truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeAttachment(index)} className="text-muted-foreground hover:text-red-400 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload button */}
                    <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all">
                        {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                            {uploading ? 'Uploading...' : 'Click to attach files (PDF, Images)'}
                        </span>
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                            multiple
                            disabled={uploading}
                        />
                    </label>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-xs">
                    This announcement will be visible to all students in this batch immediately.
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading || uploading}>Cancel</Button>
                    <Button type="submit" disabled={loading || uploading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Announcement
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateAnnouncementModal;
