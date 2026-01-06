import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import Modal from '../../ui/Modal';
import api from '../../../services/api';
import { Link as LinkIcon, Loader2 } from 'lucide-react';

const AddResourceModal = ({ isOpen, onClose, batchId, onResourceAdded }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        type: 'link'
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTypeChange = (e) => {
        setFormData({ ...formData, type: e.target.value });
        // Reset file/url when switching types
        setSelectedFile(null);
        if (e.target.value !== 'link' && e.target.value !== 'other') {
           setFormData(prev => ({ ...prev, url: '' }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalUrl = formData.url;

            // 1. Upload File if selected (and type is pdf/image)
            if ((formData.type === 'pdf' || formData.type === 'image') && selectedFile) {
                const uploadData = new FormData();
                uploadData.append('resource', selectedFile);
                
                try {
                     const uploadRes = await api.post('/upload/resource', uploadData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                     });
                     finalUrl = uploadRes.data.data; // The backend returns the full URL
                } catch (uploadError) {
                    console.error("Upload failed", uploadError);
                    alert("File upload failed: " + (uploadError.response?.data?.message || uploadError.message));
                    setLoading(false);
                    return; // Stop submission
                }
            } else if ((formData.type === 'pdf' || formData.type === 'image') && !formData.url) {
                 alert("Please select a file to upload.");
                 setLoading(false);
                 return;
            }

            // 2. Create Resource with URL
            const res = await api.post(`/batches/${batchId}/resources`, {
                ...formData,
                url: finalUrl
            });

            if (onResourceAdded) {
                onResourceAdded(res.data.data);
            }
            onClose();
            setFormData({ title: '', url: '', type: 'link' });
            setSelectedFile(null);
        } catch (error) {
            console.error('Failed to add resource', error);
            alert(error.response?.data?.message || 'Failed to add resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Study Material">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                        name="title" 
                        placeholder="e.g. Week 1 Notes, Reference PDF" 
                        value={formData.title} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="link">Link / URL</option>
                        <option value="pdf">PDF Document</option>
                        <option value="image">Image</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {formData.type === 'pdf' || formData.type === 'image' ? 'Upload File' : 'URL / Link'}
                    </label>
                    
                    {formData.type === 'pdf' || formData.type === 'image' ? (
                        <div className="flex flex-col gap-2">
                             <Input 
                                type="file"
                                onChange={handleFileChange}
                                accept={formData.type === 'image' ? "image/*" : "application/pdf"}
                                required={!formData.url} // Required if no URL is already set (basic validation)
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload a {formData.type === 'image' ? 'valid image (PNG, JPG)' : 'PDF document'}. Max 10MB.
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                name="url" 
                                placeholder="https://drive.google.com/..." 
                                value={formData.url} 
                                onChange={handleChange} 
                                className="pl-9"
                                required 
                            />
                            <p className="text-xs text-muted-foreground">Paste a direct link to the resource (Google Drive, Dropbox, etc.)</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Resource
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddResourceModal;
