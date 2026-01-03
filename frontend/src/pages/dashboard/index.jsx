import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import TrainerDashboard from './TrainerDashboard';

const DashboardRedirect = () => {
    const { user } = useAuth();

    if (user?.role === 'trainer' || user?.role === 'admin') {
        return <TrainerDashboard />;
    }
    
    return <StudentDashboard />;
};

export default DashboardRedirect;
