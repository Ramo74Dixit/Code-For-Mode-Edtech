import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowRight, Sparkles } from 'lucide-react';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
       {/* Left Panel - Branding */}
       <div className="hidden lg:flex w-1/2 bg-zinc-900 relative items-center justify-center p-12 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 to-blue-900/20" />
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
         
         <div className="relative z-10 text-center space-y-6 max-w-lg">
             <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mb-6 ring-4 ring-white/5">
                <Sparkles className="h-10 w-10 text-purple-400" />
             </div>
             <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
                 Start Your Journey
             </h1>
             <p className="text-lg text-zinc-400 leading-relaxed">
                 Create an account to unlock exclusive courses, live mentorship, and a community of passionate learners.
             </p>
         </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up to get started with EdTech
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <GoogleAuthButton text="Sign up with Google" role={formData.role} />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">I want to join as</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-11 bg-muted/50 border border-input rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="student">Student</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>

            <Button type="submit" variant="gradient" className="w-full h-11 mt-2" isLoading={isLoading}>
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
