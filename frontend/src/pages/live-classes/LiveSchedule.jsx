import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Video, Calendar, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';

const LiveSchedule = () => {
    // Mock data
    const sessions = [
        { id: 1, title: 'Into to Hooks', batch: 'June 2025 Cohort', startTime: '2025-06-10T10:00:00', link: '#' },
        { id: 2, title: 'Advanced State Management', batch: 'June 2025 Cohort', startTime: '2025-06-12T10:00:00', link: '#' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Live Schedule</h1>
            
            <div className="space-y-4">
                {sessions.map(session => (
                    <Card key={session.id}>
                        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg">{session.title}</h3>
                                <p className="text-muted-foreground">{session.batch}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(session.startTime).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            
                            <Button className="w-full sm:w-auto">
                                <Video className="mr-2 h-4 w-4" />
                                Join Class
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default LiveSchedule;
