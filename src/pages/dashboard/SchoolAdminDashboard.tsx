import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  Users, UserCheck, BookOpen, Calendar, CreditCard,
  TrendingUp, Clock, Award, Bell, ArrowRight, AlertTriangle,
  CheckCircle2, XCircle, GraduationCap, FileText, MessageSquare, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

interface SubscriptionLimit {
  allowed: boolean;
  current: number;
  max: number;
  features: Record<string, boolean>;
  plan: string;
}

export default function SchoolAdminDashboard() {
  const { user } = useAuth();

  // Get user's school
  const { data: userSchool } = useQuery({
    queryKey: ['user-school', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('school_users')
        .select('school_id, schools(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const schoolId = userSchool?.school_id;

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['school-admin-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;

      const [students, teachers, attendance, fees, notices] = await Promise.all([
        supabase.from('students').select('id, status', { count: 'exact' }).eq('school_id', schoolId),
        supabase.from('teachers').select('id, status', { count: 'exact' }).eq('school_id', schoolId),
        supabase.from('attendance').select('status').eq('date', format(new Date(), 'yyyy-MM-dd')),
        supabase.from('fees').select('amount, status'),
        supabase.from('notices').select('id', { count: 'exact' }).eq('is_published', true),
      ]);

      const activeStudents = students.data?.filter(s => s.status === 'active').length || 0;
      const presentToday = attendance.data?.filter(a => a.status === 'present').length || 0;
      const totalAttendance = attendance.data?.length || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentToday / totalAttendance) * 100) : 0;

      const pendingFees = fees.data?.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const paidFees = fees.data?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0;

      return {
        totalStudents: students.count || 0,
        activeStudents,
        totalTeachers: teachers.count || 0,
        activeTeachers: teachers.data?.filter(t => t.status === 'active').length || 0,
        attendanceRate,
        presentToday,
        totalAttendance,
        pendingFees,
        paidFees,
        totalNotices: notices.count || 0,
      };
    },
    enabled: !!schoolId,
  });

  // Check subscription limits
  const { data: studentLimit } = useQuery({
    queryKey: ['student-limit', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase.rpc('check_school_limit', { 
        _school_id: schoolId, 
        _entity_type: 'student' 
      });
      return data as unknown as SubscriptionLimit;
    },
    enabled: !!schoolId,
  });

  const { data: teacherLimit } = useQuery({
    queryKey: ['teacher-limit', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase.rpc('check_school_limit', { 
        _school_id: schoolId, 
        _entity_type: 'teacher' 
      });
      return data as unknown as SubscriptionLimit;
    },
    enabled: !!schoolId,
  });

  // Fetch recent activities
  const { data: recentNotices } = useQuery({
    queryKey: ['school-recent-notices'],
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

  // Attendance trend data (mock - would come from real data)
  const attendanceTrend = [
    { day: 'শনি', rate: 92 },
    { day: 'রবি', rate: 88 },
    { day: 'সোম', rate: 95 },
    { day: 'মঙ্গল', rate: 91 },
    { day: 'বুধ', rate: 89 },
    { day: 'বৃহঃ', rate: 93 },
    { day: 'শুক্র', rate: 85 },
  ];

  // Fee status data
  const feeStatusData = [
    { name: 'পরিশোধিত', value: stats?.paidFees || 0 },
    { name: 'বকেয়া', value: stats?.pendingFees || 0 },
  ];

  const school = userSchool?.schools as any;
  const planName = school?.subscription_plan || 'basic';
  const planLabels: Record<string, string> = {
    basic: 'বেসিক',
    standard: 'স্ট্যান্ডার্ড',
    premium: 'প্রিমিয়াম',
    enterprise: 'এন্টারপ্রাইজ',
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color, href }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-bangla">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {subValue && (
                <p className="text-sm text-muted-foreground mt-1 font-bangla">{subValue}</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          {href && (
            <Link to={href} className="absolute inset-0" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const QuickAction = ({ icon: Icon, label, href, color }: any) => (
    <Link to={href}>
      <motion.div 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }} 
        className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-all cursor-pointer"
      >
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <p className="font-medium font-bangla text-sm">{label}</p>
      </motion.div>
    </Link>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with School Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">স্কুল অ্যাডমিন ড্যাশবোর্ড</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              {school?.name_bn || school?.name || 'স্কুল'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-bangla px-3 py-1">
              <GraduationCap className="w-4 h-4 mr-1" />
              {planLabels[planName]} প্ল্যান
            </Badge>
            {school?.subscription_end && (
              <Badge variant="secondary" className="font-bangla">
                মেয়াদ: {format(new Date(school.subscription_end), 'dd MMM yyyy', { locale: bn })}
              </Badge>
            )}
          </div>
        </div>

        {/* Subscription Limit Warnings */}
        {studentLimit && !studentLimit.allowed && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="font-bangla text-red-700">
                  শিক্ষার্থী লিমিট অতিক্রম করেছে ({studentLimit.current}/{studentLimit.max})। আপগ্রেড করতে যোগাযোগ করুন।
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="মোট শিক্ষার্থী"
            value={stats?.totalStudents || 0}
            subValue={studentLimit?.max ? `সীমা: ${studentLimit.max}` : undefined}
            color="bg-primary"
            href="/dashboard/students"
          />
          <StatCard
            icon={UserCheck}
            label="মোট শিক্ষক"
            value={stats?.totalTeachers || 0}
            subValue={teacherLimit?.max ? `সীমা: ${teacherLimit.max}` : undefined}
            color="bg-secondary"
            href="/dashboard/teachers"
          />
          <StatCard
            icon={Calendar}
            label="আজকের উপস্থিতি"
            value={`${stats?.attendanceRate || 0}%`}
            subValue={`${stats?.presentToday || 0}/${stats?.totalAttendance || 0} উপস্থিত`}
            color="bg-accent"
            href="/dashboard/attendance"
          />
          <StatCard
            icon={CreditCard}
            label="বকেয়া ফি"
            value={`৳${(stats?.pendingFees || 0).toLocaleString('bn-BD')}`}
            color="bg-destructive"
            href="/dashboard/fees"
          />
        </div>

        {/* Usage Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentLimit && studentLimit.max > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bangla text-sm">শিক্ষার্থী ব্যবহার</span>
                  <span className="text-sm text-muted-foreground">
                    {studentLimit.current}/{studentLimit.max}
                  </span>
                </div>
                <Progress 
                  value={(studentLimit.current / studentLimit.max) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}
          {teacherLimit && teacherLimit.max > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bangla text-sm">শিক্ষক ব্যবহার</span>
                  <span className="text-sm text-muted-foreground">
                    {teacherLimit.current}/{teacherLimit.max}
                  </span>
                </div>
                <Progress 
                  value={(teacherLimit.current / teacherLimit.max) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 font-bangla">দ্রুত অ্যাকশন</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <QuickAction icon={Users} label="নতুন শিক্ষার্থী" href="/dashboard/students" color="bg-primary" />
            <QuickAction icon={UserCheck} label="নতুন শিক্ষক" href="/dashboard/teachers" color="bg-secondary" />
            <QuickAction icon={Calendar} label="উপস্থিতি নিন" href="/dashboard/attendance" color="bg-accent" />
            <QuickAction icon={BookOpen} label="পরীক্ষা" href="/dashboard/exams" color="bg-primary" />
            <QuickAction icon={FileText} label="নোটিশ" href="/dashboard/notices" color="bg-secondary" />
            <QuickAction icon={CreditCard} label="ফি সংগ্রহ" href="/dashboard/fees" color="bg-accent" />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">সাপ্তাহিক উপস্থিতি</CardTitle>
              <CardDescription className="font-bangla">গত ৭ দিনের উপস্থিতি হার</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip formatter={(value) => [`${value}%`, 'উপস্থিতি']} />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRate)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fee Status */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">ফি সংগ্রহ অবস্থা</CardTitle>
              <CardDescription className="font-bangla">পরিশোধিত ও বকেয়া ফি</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={feeStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ৳${value.toLocaleString('bn-BD')}` : ''}
                  >
                    {feeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `৳${value.toLocaleString('bn-BD')}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="space-y-3">
                {recentNotices?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 font-bangla">কোনো নোটিশ নেই</p>
                ) : (
                  recentNotices?.map((notice: any) => (
                    <div key={notice.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium font-bangla">{notice.title_bn || notice.title}</p>
                        <p className="text-sm text-muted-foreground font-bangla">
                          {format(new Date(notice.published_at), 'dd MMM yyyy', { locale: bn })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">আসন্ন কার্যক্রম</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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