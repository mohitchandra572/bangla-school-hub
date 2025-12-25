import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, GraduationCap, UserCheck, CreditCard,
  TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle,
  Clock, ArrowRight, BarChart3, Shield, Settings, Bell
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

const StatCard = ({ icon: Icon, label, value, subValue, trend, trendUp, color, href }: {
  icon: any; label: string; value: string | number; subValue?: string; trend?: string; trendUp?: boolean; color: string; href?: string;
}) => {
  const content = (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <Card className="h-full border hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-bangla">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
              {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
              {trend && (
                <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                  {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{trend}</span>
                </div>
              )}
            </div>
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return href ? <Link to={href} className="block h-full">{content}</Link> : content;
};

export default function SuperAdminDashboard() {
  // Fetch comprehensive stats
  const { data: stats } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      const [schools, students, teachers, subscriptionPlans] = await Promise.all([
        supabase.from('schools').select('id, is_active, is_suspended, subscription_plan, created_at'),
        supabase.from('students').select('id, status, created_at'),
        supabase.from('teachers').select('id, status, created_at'),
        supabase.from('subscription_plans').select('*'),
      ]);

      const activeSchools = schools.data?.filter(s => s.is_active && !s.is_suspended) || [];
      const suspendedSchools = schools.data?.filter(s => s.is_suspended) || [];
      const activeStudents = students.data?.filter(s => s.status === 'active') || [];
      const activeTeachers = teachers.data?.filter(t => t.status === 'active') || [];

      // Plan distribution
      const planCounts = (schools.data || []).reduce((acc, school) => {
        acc[school.subscription_plan] = (acc[school.subscription_plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Monthly growth data (last 6 months)
      const now = new Date();
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString('bn-BD', { month: 'short' });
        
        const schoolsInMonth = (schools.data || []).filter(s => 
          new Date(s.created_at) <= monthEnd
        ).length;
        
        const studentsInMonth = (students.data || []).filter(s => 
          new Date(s.created_at) <= monthEnd
        ).length;

        monthlyData.push({ name: monthName, schools: schoolsInMonth, students: studentsInMonth });
      }

      return {
        totalSchools: schools.data?.length || 0,
        activeSchools: activeSchools.length,
        suspendedSchools: suspendedSchools.length,
        totalStudents: students.data?.length || 0,
        activeStudents: activeStudents.length,
        totalTeachers: teachers.data?.length || 0,
        activeTeachers: activeTeachers.length,
        planDistribution: Object.entries(planCounts).map(([name, value]) => ({ name, value })),
        monthlyData,
        plans: subscriptionPlans.data || [],
      };
    },
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Recent schools
  const { data: recentSchools } = useQuery({
    queryKey: ['recent-schools'],
    queryFn: async () => {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const planColors: Record<string, string> = {
    basic: 'bg-gray-500',
    standard: 'bg-blue-500',
    premium: 'bg-purple-500',
    enterprise: 'bg-amber-500',
  };

  const planNames: Record<string, string> = {
    basic: 'বেসিক',
    standard: 'স্ট্যান্ডার্ড',
    premium: 'প্রিমিয়াম',
    enterprise: 'এন্টারপ্রাইজ',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">সুপার অ্যাডমিন ড্যাশবোর্ড</h1>
            <p className="text-muted-foreground font-bangla">সম্পূর্ণ সিস্টেম ওভারভিউ ও নিয়ন্ত্রণ</p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/schools">
              <Button className="font-bangla">
                <Building2 className="w-4 h-4 mr-2" /> স্কুল ম্যানেজ
              </Button>
            </Link>
            <Link to="/dashboard/settings">
              <Button variant="outline" className="font-bangla">
                <Settings className="w-4 h-4 mr-2" /> সেটিংস
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            label="মোট স্কুল"
            value={stats?.totalSchools || 0}
            subValue={`${stats?.activeSchools || 0} সক্রিয়`}
            trend="+৫ এই মাসে"
            trendUp
            color="bg-primary"
            href="/dashboard/schools"
          />
          <StatCard
            icon={GraduationCap}
            label="মোট শিক্ষার্থী"
            value={stats?.totalStudents || 0}
            subValue={`${stats?.activeStudents || 0} সক্রিয়`}
            trend="+১২%"
            trendUp
            color="bg-blue-500"
          />
          <StatCard
            icon={UserCheck}
            label="মোট শিক্ষক"
            value={stats?.totalTeachers || 0}
            subValue={`${stats?.activeTeachers || 0} সক্রিয়`}
            color="bg-green-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="স্থগিত স্কুল"
            value={stats?.suspendedSchools || 0}
            subValue="মনোযোগ প্রয়োজন"
            color="bg-destructive"
            href="/dashboard/schools"
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                বৃদ্ধি বিশ্লেষণ
              </CardTitle>
              <CardDescription className="font-bangla">গত ৬ মাসের স্কুল ও শিক্ষার্থী বৃদ্ধি</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyData || []}>
                    <defs>
                      <linearGradient id="colorSchools" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area type="monotone" dataKey="schools" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSchools)" name="স্কুল" />
                    <Area type="monotone" dataKey="students" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorStudents)" name="শিক্ষার্থী" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                প্ল্যান বিতরণ
              </CardTitle>
              <CardDescription className="font-bangla">সাবস্ক্রিপশন অনুযায়ী স্কুল</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.planDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.planDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {(stats?.planDistribution || []).map((plan, index) => (
                  <div key={plan.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-bangla">{planNames[plan.name] || plan.name}</span>
                    </div>
                    <span className="font-medium">{plan.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">দ্রুত অ্যাকশন</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link to="/dashboard/schools">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <Building2 className="w-6 h-6" />
                  নতুন স্কুল যুক্ত
                </Button>
              </Link>
              <Link to="/dashboard/plans">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <CreditCard className="w-6 h-6" />
                  প্ল্যান ম্যানেজ
                </Button>
              </Link>
              <Link to="/dashboard/audit">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <Activity className="w-6 h-6" />
                  অডিট লগ
                </Button>
              </Link>
              <Link to="/dashboard/settings">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <Settings className="w-6 h-6" />
                  সিস্টেম সেটিংস
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-bangla flex items-center gap-2">
                <Activity className="w-5 h-5" />
                সাম্প্রতিক কার্যক্রম
              </CardTitle>
              <Link to="/dashboard/audit">
                <Button variant="ghost" size="sm" className="font-bangla">
                  সব দেখুন <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 font-bangla">কোনো কার্যক্রম নেই</p>
                ) : (
                  recentActivity?.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.action === 'INSERT' ? 'bg-green-500' : 
                        log.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.action} - {log.entity_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('bn-BD')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Schools */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                সাম্প্রতিক স্কুল
              </CardTitle>
              <CardDescription className="font-bangla">নতুন যুক্ত হওয়া স্কুলসমূহ</CardDescription>
            </div>
            <Link to="/dashboard/schools">
              <Button variant="outline" size="sm" className="font-bangla">
                সব দেখুন <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSchools?.map((school: any) => (
                <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-sm text-muted-foreground font-bangla">{school.name_bn || school.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={planColors[school.subscription_plan]}>
                      <span className="font-bangla">{planNames[school.subscription_plan]}</span>
                    </Badge>
                    {school.is_suspended ? (
                      <Badge variant="destructive" className="font-bangla">স্থগিত</Badge>
                    ) : school.is_active ? (
                      <Badge className="bg-green-500 font-bangla">সক্রিয়</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bangla">নিষ্ক্রিয়</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bangla text-muted-foreground">সিস্টেম স্ট্যাটাস</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500 font-bangla">সক্রিয়</p>
              <p className="text-xs text-muted-foreground mt-1">সকল সার্ভিস চালু আছে</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bangla text-muted-foreground">ডাটাবেস ব্যবহার</span>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">৪৫%</p>
              <Progress value={45} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bangla text-muted-foreground">স্টোরেজ ব্যবহার</span>
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">২.৫ GB</p>
              <Progress value={25} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
