import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MainLayout from './components/layout/MainLayout';
import DashboardRedirect from './pages/dashboard';
import CourseList from './pages/courses/CourseList';
import CreateCourse from './pages/courses/CreateCourse';
import CourseDetails from './pages/courses/CourseDetails';
import BatchList from './pages/batches/BatchList';
import CreateBatch from './pages/batches/CreateBatch';
import BatchDetails from './pages/batches/BatchDetails';
import BatchLearningHub from './pages/batches/BatchLearningHub';
import AssignmentList from './pages/assignments/AssignmentList';
import LiveSchedule from './pages/live-classes/LiveSchedule';
import Profile from './pages/profile/Profile';
import TrainerProfile from './pages/profile/TrainerProfile';

// Temporary protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardRedirect />} />
              <Route path="courses" element={<Outlet />}>
                 <Route index element={<CourseList />} />
                 <Route path="create" element={<CreateCourse />} />
                 <Route path=":id" element={<CourseDetails />} />
              </Route>
              
              <Route path="batches" element={<Outlet />}>
                 <Route path="/batches" element={<BatchList />} />
              <Route path="/batches/create" element={<CreateBatch />} />
              <Route path="/batches/:id" element={<BatchDetails />} />
              <Route path="/batches/:id/learn" element={<BatchLearningHub />} />
              </Route>

              <Route path="assignments" element={<AssignmentList />} />
              <Route path="live-classes" element={<LiveSchedule />} />
              <Route path="profile" element={<Profile />} />
              <Route path="trainer/:id" element={<TrainerProfile />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
