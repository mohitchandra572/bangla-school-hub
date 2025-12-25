import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  Download, Users, Calendar, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, FileText, Printer
} from 'lucide-react';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const sections = ['ক', 'খ', 'গ', 'ঘ'];
const months = [
  { value: '0', label: 'জানুয়ারি' },
  { value: '1', label: 'ফেব্রুয়ারি' },
  { value: '2', label: 'মার্চ' },
  { value: '3', label: 'এপ্রিল' },
  { value: '4', label: 'মে' },
  { value: '5', label: 'জুন' },
  { value: '6', label: 'জুলাই' },
  { value: '7', label: 'আগস্ট' },
  { value: '8', label: 'সেপ্টেম্বর' },
  { value: '9', label: 'অক্টোবর' },
  { value: '10', label: 'নভেম্বর' },
  { value: '11', label: 'ডিসেম্বর' },
];

export default function AttendanceReportsPage() {
  const currentDate = new Date();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [reportType, setReportType] = useState<'student' | 'teacher'>('student');

  const startDate = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
  const endDate = endOfMonth(startDate);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const workingDays = daysInMonth.filter(d => !isWeekend(d)).length;

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ['students-report', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass) return [];
      let query = supabase.from('students').select('*').eq('class', selectedClass).eq('status', 'active').order('roll_number');
      if (selectedSection !== 'all') query = query.eq('section', selectedSection);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass && reportType === 'student',
  });

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ['teachers-report'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('*').eq('status', 'active').order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: reportType === 'teacher',
  });

  // Fetch student attendance for the month
  const { data: studentAttendance, isLoading: loadingStudentAttendance } = useQuery({
    queryKey: ['student-attendance-report', selectedClass, selectedSection, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!students?.length) return [];
      const studentIds = students.map(s => s.id);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .in('student_id', studentIds)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));
      if (error) throw error;
      return data || [];
    },
    enabled: !!students?.length && reportType === 'student',
  });

  // Fetch teacher attendance for the month
  const { data: teacherAttendance, isLoading: loadingTeacherAttendance } = useQuery({
    queryKey: ['teacher-attendance-report', selectedMonth, selectedYear],
    queryFn: async () => {
      if (!teachers?.length) return [];
      const teacherIds = teachers.map(t => t.id);
      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .in('teacher_id', teacherIds)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));
      if (error) throw error;
      return data || [];
    },
    enabled: !!teachers?.length && reportType === 'teacher',
  });

  // Calculate student statistics
  const studentStats = students?.map(student => {
    const records = studentAttendance?.filter(a => a.student_id === student.id) || [];
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = workingDays > 0 ? Math.round(((present + late) / workingDays) * 100) : 0;
    return { ...student, present, absent, late, percentage };
  }) || [];

  // Calculate teacher statistics
  const teacherStats = teachers?.map(teacher => {
    const records = teacherAttendance?.filter(a => a.teacher_id === teacher.id) || [];
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const leave = records.filter(r => r.status === 'leave').length;
    const percentage = workingDays > 0 ? Math.round(((present + late) / workingDays) * 100) : 0;
    return { ...teacher, present, absent, late, leave, percentage };
  }) || [];

  // Overall stats
  const overallStats = {
    totalStudents: students?.length || 0,
    totalTeachers: teachers?.length || 0,
    avgStudentAttendance: studentStats.length > 0 
      ? Math.round(studentStats.reduce((acc, s) => acc + s.percentage, 0) / studentStats.length) 
      : 0,
    avgTeacherAttendance: teacherStats.length > 0 
      ? Math.round(teacherStats.reduce((acc, t) => acc + t.percentage, 0) / teacherStats.length) 
      : 0,
  };

  const handleExport = () => {
    // Create CSV content
    let csv = '';
    if (reportType === 'student') {
      csv = 'রোল,নাম,উপস্থিত,অনুপস্থিত,বিলম্বে,উপস্থিতি হার\n';
      studentStats.forEach(s => {
        csv += `${s.roll_number},"${s.full_name_bn || s.full_name}",${s.present},${s.absent},${s.late},${s.percentage}%\n`;
      });
    } else {
      csv = 'আইডি,নাম,উপস্থিত,অনুপস্থিত,বিলম্বে,ছুটি,উপস্থিতি হার\n';
      teacherStats.forEach(t => {
        csv += `${t.employee_id},"${t.full_name_bn || t.full_name}",${t.present},${t.absent},${t.late},${t.leave || 0},${t.percentage}%\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${selectedMonth}-${selectedYear}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">উপস্থিতি রিপোর্ট</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              মাসিক উপস্থিতি বিশ্লেষণ ও রিপোর্ট
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              <span className="font-bangla">এক্সপোর্ট</span>
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              <span className="font-bangla">প্রিন্ট</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block font-bangla">রিপোর্ট টাইপ</label>
                <Select value={reportType} onValueChange={(v: 'student' | 'teacher') => setReportType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student" className="font-bangla">শিক্ষার্থী</SelectItem>
                    <SelectItem value="teacher" className="font-bangla">শিক্ষক</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {reportType === 'student' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block font-bangla">ক্লাস</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="ক্লাস নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c} className="font-bangla">{c} শ্রেণী</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block font-bangla">সেকশন</label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-bangla">সব সেকশন</SelectItem>
                        {sections.map(s => <SelectItem key={s} value={s} className="font-bangla">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block font-bangla">মাস</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value} className="font-bangla">{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block font-bangla">বছর</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">
                    {reportType === 'student' ? 'মোট শিক্ষার্থী' : 'মোট শিক্ষক'}
                  </p>
                  <p className="text-2xl font-bold">
                    {reportType === 'student' ? overallStats.totalStudents : overallStats.totalTeachers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">কার্যদিবস</p>
                  <p className="text-2xl font-bold">{workingDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">গড় উপস্থিতি</p>
                  <p className="text-2xl font-bold">
                    {reportType === 'student' ? overallStats.avgStudentAttendance : overallStats.avgTeacherAttendance}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">রিপোর্ট মাস</p>
                  <p className="text-lg font-bold font-bangla">
                    {months[parseInt(selectedMonth)]?.label} {selectedYear}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">
              {reportType === 'student' ? 'শিক্ষার্থী উপস্থিতি রিপোর্ট' : 'শিক্ষক উপস্থিতি রিপোর্ট'}
            </CardTitle>
            <CardDescription className="font-bangla">
              {months[parseInt(selectedMonth)]?.label} {selectedYear} এর মাসিক উপস্থিতি
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === 'student' && !selectedClass ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                রিপোর্ট দেখতে ক্লাস নির্বাচন করুন
              </div>
            ) : loadingStudentAttendance || loadingTeacherAttendance ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">{reportType === 'student' ? 'রোল' : 'আইডি'}</TableHead>
                      <TableHead className="font-bangla">নাম</TableHead>
                      {reportType === 'student' && <TableHead className="font-bangla">সেকশন</TableHead>}
                      {reportType === 'teacher' && <TableHead className="font-bangla">বিভাগ</TableHead>}
                      <TableHead className="font-bangla text-center">উপস্থিত</TableHead>
                      <TableHead className="font-bangla text-center">অনুপস্থিত</TableHead>
                      <TableHead className="font-bangla text-center">বিলম্বে</TableHead>
                      {reportType === 'teacher' && <TableHead className="font-bangla text-center">ছুটি</TableHead>}
                      <TableHead className="font-bangla text-center">হার</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportType === 'student' ? (
                      studentStats.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.roll_number}</TableCell>
                          <TableCell className="font-bangla">{student.full_name_bn || student.full_name}</TableCell>
                          <TableCell className="font-bangla">{student.section || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500/10 text-green-600">{student.present}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-500/10 text-red-600">{student.absent}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-yellow-500/10 text-yellow-600">{student.late}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={student.percentage >= 80 ? 'bg-green-500/10 text-green-600' : student.percentage >= 60 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}>
                              {student.percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      teacherStats.map((teacher: any) => (
                        <TableRow key={teacher.id}>
                          <TableCell>{teacher.employee_id}</TableCell>
                          <TableCell className="font-bangla">{teacher.full_name_bn || teacher.full_name}</TableCell>
                          <TableCell className="font-bangla">{teacher.department || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500/10 text-green-600">{teacher.present}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-500/10 text-red-600">{teacher.absent}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-yellow-500/10 text-yellow-600">{teacher.late}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-500/10 text-blue-600">{teacher.leave || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={teacher.percentage >= 80 ? 'bg-green-500/10 text-green-600' : teacher.percentage >= 60 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}>
                              {teacher.percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
