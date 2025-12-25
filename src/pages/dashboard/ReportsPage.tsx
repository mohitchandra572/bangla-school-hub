import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  Download, FileText, Users, Calendar, CreditCard, 
  TrendingUp, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState('6months');

  // Get user's school
  const { data: userSchool } = useQuery({
    queryKey: ['user-school', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('school_users')
        .select('school_id, schools(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const schoolId = userSchool?.school_id;

  // Fetch students data
  const { data: studentsData } = useQuery({
    queryKey: ['students-report', schoolId, selectedClass],
    queryFn: async () => {
      let query = supabase.from('students').select('*');
      
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!schoolId,
  });

  // Fetch attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-report', schoolId, dateRange],
    queryFn: async () => {
      const months = dateRange === '3months' ? 3 : dateRange === '6months' ? 6 : 12;
      const startDate = format(subMonths(new Date(), months), 'yyyy-MM-dd');
      
      const { data } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', startDate);
      
      return data || [];
    },
  });

  // Fetch fees data
  const { data: feesData } = useQuery({
    queryKey: ['fees-report', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('fees').select('*');
      return data || [];
    },
  });

  // Fetch exams data
  const { data: examsData } = useQuery({
    queryKey: ['exams-report'],
    queryFn: async () => {
      const { data } = await supabase.from('exams').select('*');
      return data || [];
    },
  });

  // Process students by class
  const studentsByClass = classes.map(cls => ({
    name: cls,
    total: studentsData?.filter(s => s.class === cls).length || 0,
    active: studentsData?.filter(s => s.class === cls && s.status === 'active').length || 0,
  }));

  // Process students by gender
  const genderDistribution = [
    { name: 'ছাত্র', value: studentsData?.filter(s => s.gender === 'male').length || 0 },
    { name: 'ছাত্রী', value: studentsData?.filter(s => s.gender === 'female').length || 0 },
  ];

  // Process monthly attendance
  const monthlyAttendance = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthData = attendanceData?.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    }) || [];

    const present = monthData.filter(a => a.status === 'present').length;
    const total = monthData.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      month: format(monthDate, 'MMM', { locale: bn }),
      rate,
      present,
      absent: total - present,
    };
  });

  // Process fee collection
  const feeStats = {
    total: feesData?.reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    paid: feesData?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    pending: feesData?.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
  };

  const feeCollection = [
    { name: 'পরিশোধিত', value: feeStats.paid },
    { name: 'বকেয়া', value: feeStats.pending },
  ];

  // Export functions
  const exportStudentsReport = () => {
    if (!studentsData?.length) {
      toast.error('কোনো ডেটা নেই');
      return;
    }

    const headers = ['নাম', 'ক্লাস', 'সেকশন', 'রোল নম্বর', 'অবস্থা', 'ফোন'];
    const rows = studentsData.map(s => [
      s.full_name_bn || s.full_name,
      s.class,
      s.section || '',
      s.roll_number,
      s.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়',
      s.phone || '',
    ]);

    downloadCSV(headers, rows, 'students_report');
  };

  const exportAttendanceReport = () => {
    const headers = ['মাস', 'উপস্থিতি হার (%)', 'উপস্থিত', 'অনুপস্থিত'];
    const rows = monthlyAttendance.map(m => [m.month, m.rate, m.present, m.absent]);
    downloadCSV(headers, rows, 'attendance_report');
  };

  const exportFeeReport = () => {
    if (!feesData?.length) {
      toast.error('কোনো ডেটা নেই');
      return;
    }

    const headers = ['তারিখ', 'পরিমাণ', 'অবস্থা', 'ফি ধরন'];
    const rows = feesData.map(f => [
      format(new Date(f.due_date), 'dd/MM/yyyy'),
      f.amount,
      f.status === 'paid' ? 'পরিশোধিত' : 'বকেয়া',
      f.fee_type,
    ]);
    downloadCSV(headers, rows, 'fee_report');
  };

  const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('রিপোর্ট ডাউনলোড হয়েছে');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">রিপোর্ট ও বিশ্লেষণ</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              বিস্তারিত পরিসংখ্যান ও বিশ্লেষণ দেখুন
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months" className="font-bangla">গত ৩ মাস</SelectItem>
                <SelectItem value="6months" className="font-bangla">গত ৬ মাস</SelectItem>
                <SelectItem value="12months" className="font-bangla">গত ১ বছর</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষার্থী</p>
                  <p className="text-2xl font-bold">{studentsData?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">গড় উপস্থিতি</p>
                  <p className="text-2xl font-bold">
                    {monthlyAttendance.length > 0 
                      ? Math.round(monthlyAttendance.reduce((sum, m) => sum + m.rate, 0) / monthlyAttendance.length) 
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">ফি সংগ্রহ</p>
                  <p className="text-2xl font-bold">৳{feeStats.paid.toLocaleString('bn-BD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট পরীক্ষা</p>
                  <p className="text-2xl font-bold">{examsData?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students" className="font-bangla">শিক্ষার্থী</TabsTrigger>
            <TabsTrigger value="attendance" className="font-bangla">উপস্থিতি</TabsTrigger>
            <TabsTrigger value="fees" className="font-bangla">ফি সংগ্রহ</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={exportStudentsReport}>
                <Download className="w-4 h-4 mr-2" />
                <span className="font-bangla">CSV ডাউনলোড</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla">ক্লাস অনুযায়ী শিক্ষার্থী</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentsByClass}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="total" fill="hsl(var(--primary))" name="মোট" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla">লিঙ্গ অনুপাত</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {genderDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={exportAttendanceReport}>
                <Download className="w-4 h-4 mr-2" />
                <span className="font-bangla">CSV ডাউনলোড</span>
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">মাসিক উপস্থিতি হার</CardTitle>
                <CardDescription className="font-bangla">গত ৬ মাসের উপস্থিতি</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={monthlyAttendance}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip formatter={(value) => [`${value}%`, 'উপস্থিতি হার']} />
                    <Area 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorAttendance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={exportFeeReport}>
                <Download className="w-4 h-4 mr-2" />
                <span className="font-bangla">CSV ডাউনলোড</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla">ফি সংগ্রহ অবস্থা</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={feeCollection}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ৳${value.toLocaleString('bn-BD')}`}
                      >
                        {feeCollection.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `৳${value.toLocaleString('bn-BD')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla">ফি সারসংক্ষেপ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                    <span className="font-bangla">মোট ফি</span>
                    <span className="font-bold">৳{feeStats.total.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-green-500/10">
                    <span className="font-bangla">পরিশোধিত</span>
                    <span className="font-bold text-green-600">৳{feeStats.paid.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-yellow-500/10">
                    <span className="font-bangla">বকেয়া</span>
                    <span className="font-bold text-yellow-600">৳{feeStats.pending.toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10">
                    <span className="font-bangla">সংগ্রহ হার</span>
                    <span className="font-bold text-primary">
                      {feeStats.total > 0 ? Math.round((feeStats.paid / feeStats.total) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}