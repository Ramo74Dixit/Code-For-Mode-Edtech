import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Video, 
  LogOut, 
  Menu,
  X,
  Shield,
  MessageSquare,
  Bell,
  Bot,
  GraduationCap,
  FileText,
  FolderOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SidebarItem = ({ icon: Icon, label, href, active }) => (
  <Link
    to={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
      active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted/50"
    )}
  >
    <Icon className="h-4 w-4" />
    {label}
  </Link>
);

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: BookOpen, label: 'Courses', href: '/courses' },
    { icon: Users, label: 'Batches', href: '/batches' },
    { icon: Video, label: 'Live Classes', href: '/live-classes' },
    { icon: FileText, label: 'Assignments', href: '/assignments' },
    { icon: FolderOpen, label: 'Materials', href: '/materials' },
    { icon: MessageSquare, label: 'Community', href: '/community' },
    { icon: Bell, label: 'Announcements', href: '/announcements' },
    { icon: Bot,           label: 'Interview Coach', href: '/interview' },
    { icon: GraduationCap, label: 'AI Tutor',        href: '/ai-tutor' },
  ];

  if (user?.role === 'admin') {
      navItems.push({ icon: Shield, label: 'Admin', href: '/admin' });
  }

  return (
    // FIX 1: Removed 'grid' classes. Use min-h-screen w-full flex-col
    <div className="min-h-screen w-full bg-background">
      
      {/* Sidebar (Desktop) - Fixed Position */}
      <div className="hidden border-r bg-background/95 backdrop-blur-xl md:block fixed inset-y-0 left-0 z-30 w-[220px] lg:w-[280px]">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">EdTech Platform</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
              {navItems.map((item) => (
                <SidebarItem 
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={location.pathname === item.href}
                />
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
             <Link to="/profile" className="flex items-center gap-4 px-2 py-4 border-t hover:bg-muted/50 transition-colors cursor-pointer rounded-lg">
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                </div>
             </Link>
             <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
               <LogOut className="h-4 w-4" />
               Logout
             </Button>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      {/* FIX 2: Added 'w-full' and kept padding-left to push content */}
      <div className="flex flex-col md:pl-[220px] lg:pl-[280px] w-full min-h-screen transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background/60 backdrop-blur-xl px-4 lg:h-[60px] lg:px-6 md:hidden sticky top-0 z-40">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu className="h-5 w-5" />
            </Button>
             <span className="font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">EdTech</span>
        </header>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
             <div className="fixed inset-0 z-50 bg-background md:hidden animate-in slide-in-from-left-80">
                 <div className="flex items-center justify-between p-4 border-b">
                     <span className="font-bold">Menu</span>
                     <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                         <X className="h-5 w-5" />
                     </Button>
                 </div>
                 <nav className="p-4 grid gap-2">
                    {navItems.map((item) => (
                        <SidebarItem 
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={location.pathname === item.href}
                        />
                    ))}
                    <Button variant="destructive" className="mt-8 justify-start gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                 </nav>
             </div>
        )}

        {/* Main Content Area */}
        {/* FIX 3: Removed 'bg-background' so dashboard gradient shows through */}
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;