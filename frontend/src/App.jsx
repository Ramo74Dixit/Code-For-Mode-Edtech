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
import AssignmentList from './pages/assignments/AssignmentList';
import LiveSchedule from './pages/live-classes/LiveSchedule';

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
                 <Route index element={<BatchList />} />
                 <Route path="create" element={<CreateBatch />} />
                 <Route path=":id" element={<BatchDetails />} />
              </Route>

              <Route path="assignments" element={<AssignmentList />} />
              <Route path="live-classes" element={<LiveSchedule />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
