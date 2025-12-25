import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, CheckCircle, XCircle, Clock, Save, Download, 
  Users, Fingerprint, FileText, BarChart3, Settings, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const sections = ['ক', 'খ', 'গ', 'ঘ'];

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'half_day';

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: any }> = {
  present: { label: 'উপস্থিত', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  absent: { label: 'অনুপস্থিত', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  late: { label: 'বিলম্বে', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  leave: { label: 'ছুটি', color: 'bg-blue-500/10 text-blue-600', icon: Calendar },
  half_day: { label: 'অর্ধদিন', color: 'bg-purple-500/10 text-purple-600', icon: Clock },
};

export default function AttendanceManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [checkInTimes, setCheckInTimes] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-for-attendance', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass) return [];
      let query = supabase.from('students').select('*').eq('class', selectedClass).eq('status', 'active').order('roll_number');
      if (selectedSection && selectedSection !== 'all') query = query.eq('section', selectedSection);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass && activeTab === 'student',
  });

  // Fetch teachers
  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers-for-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('*').eq('status', 'active').order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === 'teacher',
  });

  // Fetch existing student attendance
  const { data: existingStudentAttendance } = useQuery({
    queryKey: ['student-attendance', selectedClass, selectedSection, selectedDate],
    queryFn: async () => {
      if (!students?.length) return {};
      const studentIds = students.map(s => s.id);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .in('student_id', studentIds)
        .eq('date', selectedDate);
      if (error) throw error;
      const record: Record<string, AttendanceStatus> = {};
      const times: Record<string, string> = {};
      data?.forEach(a => { 
        record[a.student_id] = a.status as AttendanceStatus;
        if (a.check_in_time) times[a.student_id] = a.check_in_time;
      });
      return { record, times };
    },
    enabled: !!students?.length && activeTab === 'student',
  });

  // Fetch existing teacher attendance
  const { data: existingTeacherAttendance } = useQuery({
    queryKey: ['teacher-attendance', selectedDate],
    queryFn: async () => {
      if (!teachers?.length) return {};
      const teacherIds = teachers.map(t => t.id);
      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .in('teacher_id', teacherIds)
        .eq('date', selectedDate);
      if (error) throw error;
      const record: Record<string, AttendanceStatus> = {};
      const times: Record<string, string> = {};
      data?.forEach(a => { 
        record[a.teacher_id] = a.status as AttendanceStatus;
        if (a.check_in_time) times[a.teacher_id] = a.check_in_time;
      });
      return { record, times };
    },
    enabled: !!teachers?.length && activeTab === 'teacher',
  });

  // Sync existing attendance to state
  useEffect(() => {
    if (activeTab === 'student' && existingStudentAttendance) {
      setAttendance(existingStudentAttendance.record || {});
      setCheckInTimes(existingStudentAttendance.times || {});
    } else if (activeTab === 'teacher' && existingTeacherAttendance) {
      setAttendance(existingTeacherAttendance.record || {});
      setCheckInTimes(existingTeacherAttendance.times || {});
    }
  }, [activeTab, existingStudentAttendance, existingTeacherAttendance]);

  // Fetch biometric devices status
  const { data: deviceStats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biometric_devices')
        .select('status');
      if (error) throw error;
      return {
        total: data?.length || 0,
        online: data?.filter(d => d.status === 'online').length || 0,
      };
    },
  });

  // Save student attendance mutation
  const saveStudentMutation = useMutation({
    mutationFn: async () => {
      if (!students?.length) return;
      
      const records = students.map(student => ({
        student_id: student.id,
        date: selectedDate,
        status: attendance[student.id] || 'present',
        marked_by: user?.id,
        source: 'manual',
        approval_status: 'approved',
        check_in_time: checkInTimes[student.id] || null,
        is_late: attendance[student.id] === 'late',
      }));

      const studentIds = students.map(s => s.id);
      await supabase.from('attendance').delete().in('student_id', studentIds).eq('date', selectedDate);
      
      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-attendance'] });
      toast.success('শিক্ষার্থী উপস্থিতি সংরক্ষণ হয়েছে');
    },
    onError: (error: any) => {
      toast.error(error.message || 'সংরক্ষণে সমস্যা হয়েছে');
    },
  });

  // Save teacher attendance mutation
  const saveTeacherMutation = useMutation({
    mutationFn: async () => {
      if (!teachers?.length) return;
      
      const records = teachers.map(teacher => ({
        teacher_id: teacher.id,
        date: selectedDate,
        status: attendance[teacher.id] || 'present',
        marked_by: user?.id,
        source: 'manual',
        approval_status: 'approved',
        check_in_time: checkInTimes[teacher.id] || null,
        is_late: attendance[teacher.id] === 'late',
      }));

      const teacherIds = teachers.map(t => t.id);
      await supabase.from('teacher_attendance').delete().in('teacher_id', teacherIds).eq('date', selectedDate);
      
      const { error } = await supabase.from('teacher_attendance').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] });
      toast.success('শিক্ষক উপস্থিতি সংরক্ষণ হয়েছে');
    },
    onError: (error: any) => {
      toast.error(error.message || 'সংরক্ষণে সমস্যা হয়েছে');
    },
  });

  const toggleAttendance = (id: string) => {
    setAttendance(prev => {
      const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
      const current = prev[id] || 'present';
      const currentIndex = statuses.indexOf(current);
      const next = statuses[(currentIndex + 1) % statuses.length];
      return { ...prev, [id]: next };
    });
  };

  const markAll = (status: AttendanceStatus) => {
    const items = activeTab === 'student' ? students : teachers;
    if (!items?.length) return;
    const newAttendance: Record<string, AttendanceStatus> = {};
    items.forEach(item => { newAttendance[item.id] = status; });
    setAttendance(newAttendance);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} font-bangla`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const currentItems = activeTab === 'student' ? students : teachers;
  const stats = {
    total: currentItems?.length || 0,
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    leave: Object.values(attendance).filter(s => s === 'leave').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">উপস্থিতি ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">দৈনিক উপস্থিতি নিন ও পরিচালনা করুন</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/biometric-devices')}>
              <Fingerprint className="w-4 h-4 mr-2" />
              <span className="font-bangla">ডিভাইস ({deviceStats?.online || 0}/{deviceStats?.total || 0})</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/attendance-reports')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="font-bangla">রিপোর্ট</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAttendance({}); }}>
          <TabsList>
            <TabsTrigger value="student" className="font-bangla">
              <Users className="w-4 h-4 mr-2" />
              শিক্ষার্থী উপস্থিতি
            </TabsTrigger>
            <TabsTrigger value="teacher" className="font-bangla">
              <Users className="w-4 h-4 mr-2" />
              শিক্ষক উপস্থিতি
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block font-bangla">তারিখ</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {activeTab === 'student' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block font-bangla">ক্লাস *</label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger><SelectValue placeholder="ক্লাস নির্বাচন" /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c} value={c} className="font-bangla">{c} শ্রেণী</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block font-bangla">সেকশন</label>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger><SelectValue placeholder="সেকশন" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="font-bangla">সকল</SelectItem>
                          {sections.map(s => <SelectItem key={s} value={s} className="font-bangla">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="flex items-end gap-2 col-span-2">
                  <Button 
                    onClick={() => activeTab === 'student' ? saveStudentMutation.mutate() : saveTeacherMutation.mutate()} 
                    disabled={!currentItems?.length || saveStudentMutation.isPending || saveTeacherMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span className="font-bangla">সংরক্ষণ করুন</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="student">
            {selectedClass && students && students.length > 0 && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground font-bangla">মোট</p></CardContent></Card>
                  <Card className="bg-green-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.present}</p><p className="text-sm text-muted-foreground font-bangla">উপস্থিত</p></CardContent></Card>
                  <Card className="bg-red-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.absent}</p><p className="text-sm text-muted-foreground font-bangla">অনুপস্থিত</p></CardContent></Card>
                  <Card className="bg-yellow-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.late}</p><p className="text-sm text-muted-foreground font-bangla">বিলম্বে</p></CardContent></Card>
                  <Card className="bg-blue-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.leave}</p><p className="text-sm text-muted-foreground font-bangla">ছুটি</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</p><p className="text-sm text-muted-foreground font-bangla">হার</p></CardContent></Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => markAll('present')} className="font-bangla"><CheckCircle className="w-4 h-4 mr-1" /> সবাই উপস্থিত</Button>
                  <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="font-bangla"><XCircle className="w-4 h-4 mr-1" /> সবাই অনুপস্থিত</Button>
                </div>

                {/* Table */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 font-bangla">রোল</TableHead>
                          <TableHead className="font-bangla">নাম</TableHead>
                          <TableHead className="font-bangla">সেকশন</TableHead>
                          <TableHead className="font-bangla">প্রবেশ সময়</TableHead>
                          <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                          <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.roll_number}</TableCell>
                            <TableCell className="font-bangla">{student.full_name_bn || student.full_name}</TableCell>
                            <TableCell className="font-bangla">{student.section || '-'}</TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={checkInTimes[student.id] || ''}
                                onChange={(e) => setCheckInTimes(prev => ({...prev, [student.id]: e.target.value}))}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>{getStatusBadge(attendance[student.id] || 'present')}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => toggleAttendance(student.id)} className="font-bangla">
                                পরিবর্তন
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}

            {selectedClass && (!students || students.length === 0) && !loadingStudents && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground font-bangla">এই ক্লাসে কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                </CardContent>
              </Card>
            )}

            {!selectedClass && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-bangla">উপস্থিতি নেওয়ার জন্য ক্লাস নির্বাচন করুন</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="teacher">
            {teachers && teachers.length > 0 && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground font-bangla">মোট</p></CardContent></Card>
                  <Card className="bg-green-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.present}</p><p className="text-sm text-muted-foreground font-bangla">উপস্থিত</p></CardContent></Card>
                  <Card className="bg-red-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.absent}</p><p className="text-sm text-muted-foreground font-bangla">অনুপস্থিত</p></CardContent></Card>
                  <Card className="bg-yellow-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.late}</p><p className="text-sm text-muted-foreground font-bangla">বিলম্বে</p></CardContent></Card>
                  <Card className="bg-blue-500/5"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.leave}</p><p className="text-sm text-muted-foreground font-bangla">ছুটি</p></CardContent></Card>
                  <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</p><p className="text-sm text-muted-foreground font-bangla">হার</p></CardContent></Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => markAll('present')} className="font-bangla"><CheckCircle className="w-4 h-4 mr-1" /> সবাই উপস্থিত</Button>
                  <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="font-bangla"><XCircle className="w-4 h-4 mr-1" /> সবাই অনুপস্থিত</Button>
                </div>

                {/* Table */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bangla">আইডি</TableHead>
                          <TableHead className="font-bangla">নাম</TableHead>
                          <TableHead className="font-bangla">বিভাগ</TableHead>
                          <TableHead className="font-bangla">প্রবেশ সময়</TableHead>
                          <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                          <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teachers.map((teacher: any) => (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium">{teacher.employee_id}</TableCell>
                            <TableCell className="font-bangla">{teacher.full_name_bn || teacher.full_name}</TableCell>
                            <TableCell className="font-bangla">{teacher.department || '-'}</TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={checkInTimes[teacher.id] || ''}
                                onChange={(e) => setCheckInTimes(prev => ({...prev, [teacher.id]: e.target.value}))}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>{getStatusBadge(attendance[teacher.id] || 'present')}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => toggleAttendance(teacher.id)} className="font-bangla">
                                পরিবর্তন
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}

            {(!teachers || teachers.length === 0) && !loadingTeachers && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground font-bangla">কোনো শিক্ষক পাওয়া যায়নি</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
