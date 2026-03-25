import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Plus, X } from 'lucide-react';
import axios from 'axios';

const CreateCourseModal = ({ isOpen, onClose, onCourseCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: '',
        price: '',
        category: 'Web Development',
        level: 'Beginner',
        language: 'Hindi',
        requirements: [''],
        whatYouWillLearn: ['']
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (index, value, field) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addArrayItem = (field) => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const removeArrayItem = (index, field) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData({ ...formData, [field]: newArray });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // cleanup arrays
        const cleanedData = {
            ...formData,
            requirements: formData.requirements.filter(item => item.trim() !== ''),
            whatYouWillLearn: formData.whatYouWillLearn.filter(item => item.trim() !== '')
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('https://code-for-mode-edtech.onrender.com/api/courses', cleanedData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                onCourseCreated(response.data.data);
                onClose();
                setFormData({
                    title: '', description: '', thumbnail: '', price: '',
                    category: 'Web Development', level: 'Beginner', language: 'Hindi',
                    requirements: [''], whatYouWillLearn: ['']
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Design', 'Business', 'Other'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Course">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                {error && <div className="text-red-500 text-sm p-2 bg-red-500/10 rounded-md">{error}</div>}
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Course Title *</label>
                    <Input name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. React Mastery" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description *</label>
                    <textarea 
                        name="description" 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formData.description} 
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Thumbnail URL *</label>
                    <Input name="thumbnail" value={formData.thumbnail} onChange={handleChange} required placeholder="https://example.com/image.jpg" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Price (₹) *</label>
                        <Input type="number" name="price" value={formData.price} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Language</label>
                        <Input name="language" value={formData.language} onChange={handleChange} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category *</label>
                        <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Level</label>
                        <select 
                            name="level" 
                            value={formData.level} 
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Requirements Array */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Requirements</label>
                    {formData.requirements.map((req, index) => (
                        <div key={index} className="flex gap-2">
                            <Input 
                                value={req} 
                                onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                                placeholder={`Requirement ${index + 1}`}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem(index, 'requirements')}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('requirements')} className="w-full">
                        <Plus className="h-4 w-4 mr-2" /> Add Requirement
                    </Button>
                </div>

                {/* What You Will Learn Array */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">What You Will Learn</label>
                    {formData.whatYouWillLearn.map((item, index) => (
                        <div key={index} className="flex gap-2">
                            <Input 
                                value={item} 
                                onChange={(e) => handleArrayChange(index, e.target.value, 'whatYouWillLearn')}
                                placeholder={`Outcome ${index + 1}`}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem(index, 'whatYouWillLearn')}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('whatYouWillLearn')} className="w-full">
                        <Plus className="h-4 w-4 mr-2" /> Add Outcome
                    </Button>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Course'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateCourseModal;
