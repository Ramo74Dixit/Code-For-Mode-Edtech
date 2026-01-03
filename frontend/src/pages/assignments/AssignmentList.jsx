import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { cn } from '../../lib/utils';

const AssignmentList = () => {
    // Mock data for now
    const [assignments, setAssignments] = useState([]);
    
    // Ideally fetch /assignments/my-pending
    useEffect(() => {
        // Mock fetch
        setAssignments([
            { id: 1, title: 'React Basics Quiz', batch: 'June 2025 Cohort', dueDate: '2025-06-15', status: 'pending' },
            { id: 2, title: 'Build a Todo App', batch: 'June 2025 Cohort', dueDate: '2025-06-20', status: 'submitted' },
        ]);
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            
            <div className="grid gap-4">
                {assignments.map(assignment => (
                    <Card key={assignment.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div>
                                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{assignment.batch}</p>
                             </div>
                             <div className={cn(
                                 "px-2 py-1 rounded-full text-xs capitalize",
                                 assignment.status === 'pending' ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                             )}>
                                 {assignment.status}
                             </div>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                             </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AssignmentList;
