import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

const CreateAssignmentModal = ({ batchId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        totalMarks: 100
    });
    console.log("DEBUG: Modal batchId:", batchId); // Check if prop exists
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // FORCE CHECK
        if (!batchId) {
            alert("CRITICAL ERROR: batchId is missing! Cannot create assignment.");
            return;
        }
        alert(`DEBUG: Creating assignment for Batch ID: ${batchId}`);
        
        setLoading(true);
        try {
            console.log("DEBUG: Sending payload:", { ...formData, batchId });
            await api.post('/assignments', {
                ...formData,
                batchId 
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
            <div className="w-full max-w-lg bg-card rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold">Create New Assignment</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                             <div className="relative">
                                 <Input 
                                    type="datetime-local" 
                                    value={formData.dueDate} 
                                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                                    required
                                    className="pl-10"
                                 />
                                 <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                             </div>
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

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAssignmentModal;
