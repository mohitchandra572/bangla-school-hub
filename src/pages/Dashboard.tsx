import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, UserCheck, BookOpen, Calendar, CreditCard, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Clock, Award, Bell, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, trendUp, color }: {
  icon: any; label: string; value: string | number; trend?: string; trendUp?: boolean; color: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-hover">
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-bangla">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-secondary' : 'text-destructive'}`}>
                {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const QuickAction = ({ icon: Icon, label, href, color }: { icon: any; label: string; href: string; color: string; }) => (
  <Link to={href}>
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-card rounded-xl p-4 border border-border hover:shadow-card transition-all cursor-pointer">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <p className="font-medium font-bangla">{label}</p>
    </motion.div>
  </Link>
);

export default function Dashboard() {
  const { user, roles, isAdmin, hasRole } = useAuth();
  const primaryRole = roles[0] || 'parent';

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [students, teachers, notices] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('teachers').select('id', { count: 'exact' }),
        supabase.from('notices').select('id', { count: 'exact' }).eq('is_published', true),
      ]);
      return {
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalNotices: notices.count || 0,
      };
    },
  });

  const { data: recentNotices } = useQuery({
    queryKey: ['recent-notices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const getRoleTitle = () => {
    switch (primaryRole) {
      case 'super_admin': return 'সুপার অ্যাডমিন ড্যাশবোর্ড';
      case 'school_admin': return 'স্কুল অ্যাডমিন ড্যাশবোর্ড';
      case 'teacher': return 'শিক্ষক ড্যাশবোর্ড';
      case 'parent': return 'অভিভাবক ড্যাশবোর্ড';
      default: return 'ড্যাশবোর্ড';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-bangla">{getRoleTitle()}</h1>
          <p className="text-muted-foreground mt-1 font-bangla">
            স্বাগতম, {user?.email}
          </p>
        </div>

        {/* Stats Grid - Admin View */}
        {isAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} label="মোট শিক্ষার্থী" value={stats?.totalStudents || 0} trend="+১২% এই মাসে" trendUp color="bg-primary" />
            <StatCard icon={UserCheck} label="মোট শিক্ষক" value={stats?.totalTeachers || 0} color="bg-secondary" />
            <StatCard icon={Calendar} label="আজকের উপস্থিতি" value="৯২%" trend="+২%" trendUp color="bg-accent" />
            <StatCard icon={CreditCard} label="বকেয়া ফি" value="৳১,২৫,০০০" trend="-৮%" trendUp color="bg-destructive" />
          </div>
        )}

        {/* Teacher View */}
        {hasRole('teacher') && !isAdmin() && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} label="আমার শিক্ষার্থী" value="৪৫" color="bg-primary" />
            <StatCard icon={Calendar} label="আজকের ক্লাস" value="৪" color="bg-secondary" />
            <StatCard icon={ClipboardList} label="পেন্ডিং মূল্যায়ন" value="১২" color="bg-accent" />
            <StatCard icon={Bell} label="নতুন মেসেজ" value="৩" color="bg-destructive" />
          </div>
        )}

        {/* Parent View */}
        {hasRole('parent') && !isAdmin() && !hasRole('teacher') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} label="সন্তান সংখ্যা" value="২" color="bg-primary" />
            <StatCard icon={Calendar} label="উপস্থিতি হার" value="৯৫%" color="bg-secondary" />
            <StatCard icon={Award} label="গড় গ্রেড" value="A+" color="bg-accent" />
            <StatCard icon={CreditCard} label="বকেয়া ফি" value="৳৫,০০০" color="bg-destructive" />
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 font-bangla">দ্রুত অ্যাকশন</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {isAdmin() && (
              <>
                <QuickAction icon={Users} label="নতুন শিক্ষার্থী" href="/dashboard/students/new" color="bg-primary" />
                <QuickAction icon={UserCheck} label="নতুন শিক্ষক" href="/dashboard/teachers/new" color="bg-secondary" />
                <QuickAction icon={Calendar} label="উপস্থিতি নিন" href="/dashboard/attendance" color="bg-accent" />
                <QuickAction icon={ClipboardList} label="পরীক্ষা তৈরি" href="/dashboard/exams/new" color="bg-primary" />
                <QuickAction icon={FileText} label="নোটিশ প্রকাশ" href="/dashboard/notices/new" color="bg-secondary" />
                <QuickAction icon={BarChart3} label="রিপোর্ট" href="/dashboard/reports" color="bg-accent" />
              </>
            )}
            {hasRole('teacher') && !isAdmin() && (
              <>
                <QuickAction icon={Calendar} label="উপস্থিতি নিন" href="/dashboard/attendance" color="bg-primary" />
                <QuickAction icon={Award} label="ফলাফল প্রদান" href="/dashboard/results" color="bg-secondary" />
                <QuickAction icon={MessageSquare} label="মেসেজ পাঠান" href="/dashboard/messages" color="bg-accent" />
              </>
            )}
            {hasRole('parent') && !isAdmin() && !hasRole('teacher') && (
              <>
                <QuickAction icon={Calendar} label="উপস্থিতি দেখুন" href="/dashboard/attendance" color="bg-primary" />
                <QuickAction icon={Award} label="ফলাফল দেখুন" href="/dashboard/results" color="bg-secondary" />
                <QuickAction icon={CreditCard} label="ফি পরিশোধ" href="/dashboard/fees" color="bg-accent" />
                <QuickAction icon={MessageSquare} label="শিক্ষকের সাথে যোগাযোগ" href="/dashboard/messages" color="bg-primary" />
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Notices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-bangla">সাম্প্রতিক নোটিশ</CardTitle>
              <Link to="/dashboard/notices">
                <Button variant="ghost" size="sm" className="font-bangla">
                  সব দেখুন <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNotices?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 font-bangla">কোনো নোটিশ নেই</p>
                ) : (
                  recentNotices?.map((notice: any) => (
                    <div key={notice.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                      <div>
                        <p className="font-medium font-bangla">{notice.title_bn || notice.title}</p>
                        <p className="text-sm text-muted-foreground font-bangla">
                          {new Date(notice.published_at).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events / Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">আসন্ন কার্যক্রম</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium font-bangla">অর্ধবার্ষিক পরীক্ষা</p>
                    <p className="text-sm text-muted-foreground font-bangla">১৫ জানুয়ারি, ২০২৬</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10">
                  <Calendar className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="font-medium font-bangla">অভিভাবক সভা</p>
                    <p className="text-sm text-muted-foreground font-bangla">২০ জানুয়ারি, ২০২৬</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                  <Award className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium font-bangla">বার্ষিক পুরস্কার বিতরণী</p>
                    <p className="text-sm text-muted-foreground font-bangla">২৫ জানুয়ারি, ২০২৬</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Fix missing imports
import { ClipboardList, FileText, BarChart3, MessageSquare } from 'lucide-react';
