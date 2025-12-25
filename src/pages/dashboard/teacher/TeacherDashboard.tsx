import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Calendar, ClipboardList, Award, MessageSquare, 
  Bell, FileText, Clock, CheckCircle, AlertTriangle,
  BookOpen, TrendingUp, UserCheck, CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Fetch teacher info
  const { data: teacher } = useQuery({
    queryKey: ['teacher-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch assigned classes student count
  const { data: studentStats } = useQuery({
    queryKey: ['teacher-student-stats', teacher?.id],
    queryFn: async () => {
      if (!teacher?.assigned_classes?.length) return { total: 0, present: 0, absent: 0 };
      
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .in('class', teacher.assigned_classes)
        .eq('status', 'active');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today)
        .in('student_id', students?.map(s => s.id) || []);

      return {
        total: students?.length || 0,
        present: attendance?.filter(a => a.status === 'present').length || 0,
        absent: attendance?.filter(a => a.status === 'absent').length || 0,
      };
    },
    enabled: !!teacher?.assigned_classes?.length,
  });

  // Fetch upcoming exams
  const { data: upcomingExams } = useQuery({
    queryKey: ['teacher-upcoming-exams', teacher?.assigned_classes],
    queryFn: async () => {
      if (!teacher?.assigned_classes?.length) return [];
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .in('class', teacher.assigned_classes)
        .gte('start_date', format(new Date(), 'yyyy-MM-dd'))
        .order('start_date')
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!teacher?.assigned_classes?.length,
  });

  // Fetch unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ['teacher-unread-messages', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user?.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['teacher-notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch pending absence responses
  const { data: pendingResponses } = useQuery({
    queryKey: ['teacher-pending-responses', teacher?.assigned_classes],
    queryFn: async () => {
      if (!teacher?.assigned_classes?.length) return 0;
      
      const { count } = await supabase
        .from('absence_responses')
        .select('*, students!inner(class)', { count: 'exact', head: true })
        .in('students.class', teacher.assigned_classes)
        .eq('admin_status', 'pending');
      return count || 0;
    },
    enabled: !!teacher?.assigned_classes?.length,
  });

  const quickActions = [
    { icon: Calendar, label: 'উপস্থিতি নিন', href: '/dashboard/teacher/attendance', color: 'bg-blue-500' },
    { icon: Award, label: 'মার্কস এন্ট্রি', href: '/dashboard/teacher/marks-entry', color: 'bg-green-500' },
    { icon: MessageSquare, label: 'মেসেজ পাঠান', href: '/dashboard/messages', color: 'bg-purple-500' },
    { icon: FileText, label: 'ছুটির আবেদন', href: '/dashboard/teacher/leave', color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">
              স্বাগতম, {teacher?.full_name_bn || teacher?.full_name || 'শিক্ষক'}
            </h1>
            <p className="text-muted-foreground font-bangla">
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: bn })}
            </p>
          </div>
          {teacher && (
            <Badge variant="outline" className="font-bangla self-start">
              {teacher.designation || 'শিক্ষক'} | ID: {teacher.employee_id}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-bangla">মোট শিক্ষার্থী</p>
                    <p className="text-3xl font-bold">{studentStats?.total || 0}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-bangla">আজ উপস্থিত</p>
                    <p className="text-3xl font-bold">{studentStats?.present || 0}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-bangla">আজ অনুপস্থিত</p>
                    <p className="text-3xl font-bold">{studentStats?.absent || 0}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-bangla">অপঠিত মেসেজ</p>
                    <p className="text-3xl font-bold">{unreadMessages}</p>
                  </div>
                  <MessageSquare className="w-10 h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              দ্রুত কার্যক্রম
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, i) => (
                <Link key={i} to={action.href}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted"
                  >
                    <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bangla text-sm">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Assigned Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                আমার ক্লাস ও বিষয়
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacher?.assigned_classes?.length ? (
                  teacher.assigned_classes.map((cls: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium font-bangla">{cls} শ্রেণি</p>
                          <p className="text-sm text-muted-foreground font-bangla">
                            বিষয়: {teacher.subjects_taught?.join(', ') || 'সকল বিষয়'}
                          </p>
                        </div>
                      </div>
                      <Link to={`/dashboard/teacher/my-students?class=${cls}`}>
                        <Button size="sm" variant="ghost" className="font-bangla">
                          দেখুন
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-bangla">
                    কোনো ক্লাস অ্যাসাইন করা হয়নি
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                আসন্ন পরীক্ষা
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingExams?.length ? (
                  upcomingExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <CalendarDays className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium font-bangla">{exam.name_bn || exam.name}</p>
                          <p className="text-sm text-muted-foreground font-bangla">
                            {exam.class} শ্রেণি | {format(new Date(exam.start_date), 'dd MMM yyyy', { locale: bn })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={exam.status === 'ongoing' ? 'default' : 'secondary'}>
                        {exam.status === 'ongoing' ? 'চলমান' : 'আসন্ন'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-bangla">
                    কোনো আসন্ন পরীক্ষা নেই
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-bangla flex items-center gap-2">
                <Bell className="w-5 h-5" />
                নোটিফিকেশন
              </CardTitle>
              <Link to="/dashboard/notifications">
                <Button size="sm" variant="ghost" className="font-bangla">সব দেখুন</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications?.length ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex-1">
                        <p className="font-medium font-bangla text-sm">{notif.title_bn || notif.title}</p>
                        <p className="text-xs text-muted-foreground font-bangla line-clamp-2">
                          {notif.message_bn || notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-bangla">
                    কোনো নতুন নোটিফিকেশন নেই
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Clock className="w-5 h-5" />
                অপেক্ষমাণ কাজ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingResponses ? (
                  <Link to="/dashboard/absence-responses">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-yellow-600" />
                        <span className="font-bangla">অনুপস্থিতির কারণ পর্যালোচনা</span>
                      </div>
                      <Badge variant="secondary">{pendingResponses}</Badge>
                    </div>
                  </Link>
                ) : null}
                
                <Link to="/dashboard/teacher/marks-entry">
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span className="font-bangla">মার্কস এন্ট্রি করুন</span>
                    </div>
                    <Badge variant="secondary">নতুন</Badge>
                  </div>
                </Link>

                <Link to="/dashboard/teacher/attendance">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="font-bangla">আজকের উপস্থিতি নিন</span>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
