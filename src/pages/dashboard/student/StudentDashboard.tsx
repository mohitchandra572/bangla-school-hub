import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  BookOpen, Calendar, CreditCard, Bell, Award, 
  FileText, Clock, CheckCircle2, AlertCircle,
  GraduationCap, ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();

  // Fetch student info
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch attendance stats
  const { data: attendanceStats } = useQuery({
    queryKey: ['student-attendance-stats', student?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student?.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      const total = data?.length || 0;
      
      return { present, absent, late, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
    },
    enabled: !!student?.id
  });

  // Fetch upcoming exams
  const { data: upcomingExams } = useQuery({
    queryKey: ['student-upcoming-exams', student?.class],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, exam_routines(*)')
        .eq('class', student?.class)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!student?.class
  });

  // Fetch pending fees
  const { data: pendingFees } = useQuery({
    queryKey: ['student-pending-fees', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_invoices')
        .select('*')
        .eq('student_id', student?.id)
        .in('status', ['pending', 'partial', 'overdue']);
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['student-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch recent results
  const { data: recentResults } = useQuery({
    queryKey: ['student-recent-results', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('*, exams(name, name_bn)')
        .eq('student_id', student?.id)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  const totalPendingFees = pendingFees?.reduce((sum, f) => sum + (f.balance_amount || 0), 0) || 0;

  if (studentLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-bangla text-foreground">
              স্বাগতম, {student?.full_name_bn || student?.full_name}!
            </h1>
            <p className="text-muted-foreground font-bangla">
              {student?.class} শ্রেণি {student?.section && `• ${student?.section} শাখা`} • রোল: {student?.roll_number}
            </p>
          </div>
          <div className="text-sm text-muted-foreground font-bangla">
            {format(new Date(), 'dd MMMM, yyyy')}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceStats?.percentage || 0}%</p>
                  <p className="text-sm text-muted-foreground font-bangla">উপস্থিতি হার</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingExams?.length || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">আসন্ন পরীক্ষা</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${totalPendingFees > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <CreditCard className={`h-6 w-6 ${totalPendingFees > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">৳{totalPendingFees.toLocaleString('bn-BD')}</p>
                  <p className="text-sm text-muted-foreground font-bangla">বকেয়া ফি</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications?.length || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">নতুন নোটিফিকেশন</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">দ্রুত অ্যাক্সেস</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Link to="/dashboard/student/attendance">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <Calendar className="h-6 w-6" />
                  <span className="text-xs">উপস্থিতি</span>
                </Button>
              </Link>
              <Link to="/dashboard/student/exams">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <ClipboardList className="h-6 w-6" />
                  <span className="text-xs">পরীক্ষার রুটিন</span>
                </Button>
              </Link>
              <Link to="/dashboard/student/results">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <Award className="h-6 w-6" />
                  <span className="text-xs">ফলাফল</span>
                </Button>
              </Link>
              <Link to="/dashboard/student/admit-cards">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">প্রবেশপত্র</span>
                </Button>
              </Link>
              <Link to="/dashboard/student/fees">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-xs">ফি</span>
                </Button>
              </Link>
              <Link to="/dashboard/student/profile">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 font-bangla">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-xs">প্রোফাইল</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                আসন্ন পরীক্ষা
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams && upcomingExams.length > 0 ? (
                <div className="space-y-3">
                  {upcomingExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium font-bangla">{exam.name_bn || exam.name}</p>
                        <p className="text-sm text-muted-foreground font-bangla">
                          {format(new Date(exam.start_date), 'dd MMM, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-bangla">
                        {exam.exam_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 font-bangla">
                  কোনো আসন্ন পরীক্ষা নেই
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Award className="h-5 w-5" />
                সাম্প্রতিক ফলাফল
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentResults && recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((result: any) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium font-bangla">{result.subject}</p>
                        <p className="text-sm text-muted-foreground font-bangla">
                          {result.exams?.name_bn || result.exams?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`font-bangla ${
                          result.grade === 'A+' ? 'bg-green-500' :
                          result.grade === 'A' ? 'bg-blue-500' :
                          result.grade === 'A-' ? 'bg-blue-400' :
                          result.grade === 'B' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {result.grade}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.marks_obtained}/{result.total_marks}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 font-bangla">
                  কোনো ফলাফল প্রকাশিত হয়নি
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Bell className="h-5 w-5" />
                সাম্প্রতিক নোটিফিকেশন
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                        notification.type === 'success' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.type === 'alert' ? <AlertCircle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium font-bangla text-sm">{notification.title_bn || notification.title}</p>
                        <p className="text-xs text-muted-foreground font-bangla">{notification.message_bn || notification.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 font-bangla">
                  কোনো নতুন নোটিফিকেশন নেই
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fee Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ফি সারাংশ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingFees && pendingFees.length > 0 ? (
                <div className="space-y-3">
                  {pendingFees.slice(0, 3).map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium font-bangla">{fee.month || fee.academic_year}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(fee.due_date), 'dd MMM, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={fee.status === 'overdue' ? 'destructive' : 'outline'} className="font-bangla">
                          {fee.status === 'pending' ? 'বকেয়া' : fee.status === 'overdue' ? 'অতিরিক্ত বকেয়া' : 'আংশিক'}
                        </Badge>
                        <p className="text-sm font-medium mt-1">৳{(fee.balance_amount || 0).toLocaleString('bn-BD')}</p>
                      </div>
                    </div>
                  ))}
                  <Link to="/dashboard/student/fees">
                    <Button variant="link" className="w-full font-bangla">সব দেখুন →</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-bangla">সকল ফি পরিশোধিত!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
