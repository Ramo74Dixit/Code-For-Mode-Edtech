import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowRight, BookOpen } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative items-center justify-center p-12 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-900/40" />
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
         <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
         
         <div className="relative z-10 text-center space-y-6 max-w-lg">
             <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-6">
                <BookOpen className="h-10 w-10 text-white" />
             </div>
             <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
                 Master New Skills
             </h1>
             <p className="text-lg text-zinc-300 leading-relaxed">
                 Join thousands of learners in our advanced EdTech ecosystem. Live classes, expert mentors, and hands-on projects await.
             </p>
         </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <Link to="#" className="text-xs text-primary hover:underline">
                      Forgot password?
                  </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full h-11" isLoading={isLoading}>
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
