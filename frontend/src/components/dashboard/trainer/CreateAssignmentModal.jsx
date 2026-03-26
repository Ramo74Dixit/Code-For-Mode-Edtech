import React, { useState } from 'react';
import { X, Paperclip, FileText, Image, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import DateTimePicker from '../../ui/DateTimePicker';

const CreateAssignmentModal = ({ batchId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: null,
        totalMarks: 100
    });
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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
            e.target.value = '';
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!batchId) {
            alert("Error: batchId is missing!");
            return;
        }
        if (!formData.dueDate) {
            alert("Please select a due date.");
            return;
        }
        
        setLoading(true);
        try {
            await api.post('/assignments', {
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate.toISOString(),
                totalMarks: formData.totalMarks,
                batchId,
                attachments
            });
            onSuccess();
            onClose();
            alert("Assignment created successfully!");
        } catch (error) {
            console.error("Creation failed", error);
            alert(error.response?.data?.message || "Failed to create assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-card rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <h2 className="text-xl font-bold">Create New Assignment</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Assignment Title</label>
                        <Input 
                            placeholder="e.g. React Components Project" 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})} 
                            required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description / Instructions</label>
                        <Textarea 
                            placeholder="Describe what the students need to do..." 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            required 
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Due Date</label>
                             <DateTimePicker
                                selected={formData.dueDate}
                                onChange={(date) => setFormData({...formData, dueDate: date})}
                                placeholderText="Pick due date & time"
                                minDate={new Date()}
                                required
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Total Marks</label>
                             <Input 
                                type="number" 
                                value={formData.totalMarks} 
                                onChange={(e) => setFormData({...formData, totalMarks: e.target.value})} 
                                required
                             />
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Attachments (Optional)</label>
                        
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

                        <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-all">
                            {uploading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="text-sm text-muted-foreground">
                                {uploading ? 'Uploading...' : 'Click to attach files (PDF, Images, Docs)'}
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

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading || uploading}>
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAssignmentModal;
