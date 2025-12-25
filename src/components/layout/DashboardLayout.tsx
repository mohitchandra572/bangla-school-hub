import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, LayoutDashboard, Users, UserCheck, BookOpen, 
  ClipboardList, CreditCard, Bell, MessageSquare, BarChart3, 
  Settings, LogOut, ChevronLeft, ChevronRight, Home, FileText,
  Calendar, Award, Shield, Activity, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems = {
  super_admin: [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', href: '/dashboard/super-admin' },
    { icon: Shield, label: 'স্কুল ম্যানেজমেন্ট', href: '/dashboard/schools' },
    { icon: CreditCard, label: 'সাবস্ক্রিপশন প্ল্যান', href: '/dashboard/plans' },
    { icon: DollarSign, label: 'বিলিং', href: '/dashboard/billing' },
    { icon: Users, label: 'অভিভাবক', href: '/dashboard/parents' },
    { icon: Activity, label: 'অডিট লগ', href: '/dashboard/audit' },
    { icon: BarChart3, label: 'রিপোর্ট', href: '/dashboard/reports' },
    { icon: Settings, label: 'সিস্টেম সেটিংস', href: '/dashboard/system-settings' },
  ],
  school_admin: [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', href: '/dashboard' },
    { icon: Users, label: 'শিক্ষার্থী', href: '/dashboard/students' },
    { icon: UserCheck, label: 'শিক্ষক', href: '/dashboard/teachers' },
    { icon: BookOpen, label: 'ক্লাস ও সেকশন', href: '/dashboard/classes' },
    { icon: Calendar, label: 'উপস্থিতি', href: '/dashboard/attendance' },
    { icon: ClipboardList, label: 'পরীক্ষা', href: '/dashboard/exams' },
    { icon: Award, label: 'ফলাফল', href: '/dashboard/results' },
    { icon: CreditCard, label: 'ফি ম্যানেজমেন্ট', href: '/dashboard/fees' },
    { icon: FileText, label: 'নোটিশ', href: '/dashboard/notices' },
    { icon: MessageSquare, label: 'মেসেজ', href: '/dashboard/messages' },
    { icon: BarChart3, label: 'রিপোর্ট', href: '/dashboard/reports' },
    { icon: Settings, label: 'সেটিংস', href: '/dashboard/settings' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', href: '/dashboard' },
    { icon: Users, label: 'আমার শিক্ষার্থী', href: '/dashboard/my-students' },
    { icon: Calendar, label: 'উপস্থিতি', href: '/dashboard/attendance' },
    { icon: ClipboardList, label: 'পরীক্ষা', href: '/dashboard/exams' },
    { icon: Award, label: 'ফলাফল প্রদান', href: '/dashboard/results' },
    { icon: MessageSquare, label: 'মেসেজ', href: '/dashboard/messages' },
    { icon: Bell, label: 'নোটিফিকেশন', href: '/dashboard/notifications' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'ড্যাশবোর্ড', href: '/dashboard' },
    { icon: Users, label: 'আমার সন্তান', href: '/dashboard/my-children' },
    { icon: Calendar, label: 'উপস্থিতি', href: '/dashboard/attendance' },
    { icon: Award, label: 'ফলাফল', href: '/dashboard/results' },
    { icon: CreditCard, label: 'ফি', href: '/dashboard/fees' },
    { icon: MessageSquare, label: 'মেসেজ', href: '/dashboard/messages' },
    { icon: Bell, label: 'নোটিফিকেশন', href: '/dashboard/notifications' },
  ],
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, roles, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const primaryRole = roles[0] || 'parent';
  const items = menuItems[primaryRole as keyof typeof menuItems] || menuItems.parent;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground font-bangla">আদর্শ বিদ্যালয়</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                {!collapsed && <span className="font-medium font-bangla">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-semibold">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize font-bangla">
                  {primaryRole === 'super_admin' ? 'সুপার অ্যাডমিন' : 
                   primaryRole === 'school_admin' ? 'স্কুল অ্যাডমিন' :
                   primaryRole === 'teacher' ? 'শিক্ষক' : 'অভিভাবক'}
                </p>
              </div>
            )}
          </div>
          
          <div className={cn("mt-4 flex gap-2", collapsed && "flex-col")}>
            <Link to="/" className="flex-1">
              <Button variant="outline" size="sm" className={cn("w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "px-2")}>
                <Home className="w-4 h-4" />
                {!collapsed && <span className="ml-2 font-bangla">হোম</span>}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className={cn("border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent", collapsed ? "px-2" : "flex-1")}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="ml-2 font-bangla">লগআউট</span>}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-20" : "ml-[280px]")}>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
