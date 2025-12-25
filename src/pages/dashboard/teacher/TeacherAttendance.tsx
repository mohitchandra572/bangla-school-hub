import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Calendar, CheckCircle, XCircle, Clock, User, Save,
  Fingerprint, AlertTriangle, Users, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export default function TeacherAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [activeTab, setActiveTab] = useState('manual');

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

  // Fetch students for selected class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', selectedClass, selectedSection],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select('id, full_name, full_name_bn, roll_number, photo_url')
        .eq('class', selectedClass)
        .eq('status', 'active')
        .order('roll_number');

      if (selectedSection) {
        query = query.eq('section', selectedSection);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
  });

  // Fetch existing attendance
  const { data: existingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['existing-attendance', selectedDate, selectedClass, selectedSection],
    queryFn: async () => {
      if (!students?.length) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .in('student_id', students.map(s => s.id));
      
      if (error) throw error;
      
      // Initialize attendance data
      const initial: Record<string, AttendanceStatus> = {};
      data?.forEach(a => {
        initial[a.student_id] = a.status as AttendanceStatus;
      });
      setAttendanceData(initial);
      
      return data;
    },
    enabled: !!students?.length,
  });

  // Fetch biometric logs
  const { data: biometricLogs } = useQuery({
    queryKey: ['biometric-logs', selectedDate, selectedClass],
    queryFn: async () => {
      if (!students?.length) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*, students(full_name, full_name_bn, roll_number)')
        .eq('date', selectedDate)
        .eq('source', 'biometric')
        .in('student_id', students.map(s => s.id))
        .order('biometric_timestamp');
      
      if (error) throw error;
      return data;
    },
    enabled: !!students?.length && activeTab === 'biometric',
  });

  // Save attendance mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        date: selectedDate,
        status,
        source: 'manual',
        marked_by: user?.id,
      }));

      // Upsert attendance records
      for (const record of records) {
        const { error } = await supabase
          .from('attendance')
          .upsert(record, { onConflict: 'student_id,date' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('উপস্থিতি সফলভাবে সংরক্ষিত হয়েছে');
      refetchAttendance();
    },
    onError: (error: any) => {
      toast.error(error.message || 'উপস্থিতি সংরক্ষণে সমস্যা হয়েছে');
    },
  });

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? 'present' : status,
    }));
  };

  const markAllPresent = () => {
    const all: Record<string, AttendanceStatus> = {};
    students?.forEach(s => { all[s.id] = 'present'; });
    setAttendanceData(all);
  };

  const markAllAbsent = () => {
    const all: Record<string, AttendanceStatus> = {};
    students?.forEach(s => { all[s.id] = 'absent'; });
    setAttendanceData(all);
  };

  const classes = teacher?.assigned_classes || [];
  const sections = teacher?.assigned_sections || ['ক', 'খ', 'গ'];

  const stats = {
    total: students?.length || 0,
    present: Object.values(attendanceData).filter(s => s === 'present').length,
    absent: Object.values(attendanceData).filter(s => s === 'absent').length,
    late: Object.values(attendanceData).filter(s => s === 'late').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Calendar className="w-7 h-7" />
              উপস্থিতি
            </h1>
            <p className="text-muted-foreground font-bangla">
              {format(new Date(selectedDate), 'EEEE, dd MMMM yyyy', { locale: bn })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium font-bangla">তারিখ</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium font-bangla">শ্রেণি</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: string) => (
                      <SelectItem key={cls} value={cls}>{cls} শ্রেণি</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium font-bangla">শাখা</label>
                <Select value={selectedSection} onValueChange={(val) => setSelectedSection(val === 'all' ? '' : val)}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="শাখা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল শাখা</SelectItem>
                    {sections.map((sec: string) => (
                      <SelectItem key={sec} value={sec}>{sec} শাখা</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => refetchAttendance()} variant="outline" className="w-full font-bangla">
                  <RefreshCw className="w-4 h-4 mr-2" /> রিফ্রেশ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClass && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                  <p className="text-sm text-blue-600 font-bangla">মোট</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                  <p className="text-sm text-green-600 font-bangla">উপস্থিত</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                  <p className="text-sm text-red-600 font-bangla">অনুপস্থিত</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
                  <p className="text-sm text-yellow-600 font-bangla">বিলম্বে</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="manual" className="font-bangla gap-2">
                  <Calendar className="w-4 h-4" /> ম্যানুয়াল উপস্থিতি
                </TabsTrigger>
                <TabsTrigger value="biometric" className="font-bangla gap-2">
                  <Fingerprint className="w-4 h-4" /> বায়োমেট্রিক লগ
                </TabsTrigger>
              </TabsList>

              {/* Manual Attendance */}
              <TabsContent value="manual" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-bangla">উপস্থিতি নিন</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={markAllPresent} className="font-bangla">
                        সকল উপস্থিত
                      </Button>
                      <Button size="sm" variant="outline" onClick={markAllAbsent} className="font-bangla">
                        সকল অনুপস্থিত
                      </Button>
                      <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="font-bangla">
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {studentsLoading ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16 font-bangla">রোল</TableHead>
                            <TableHead className="font-bangla">নাম</TableHead>
                            <TableHead className="text-center font-bangla">উপস্থিত</TableHead>
                            <TableHead className="text-center font-bangla">অনুপস্থিত</TableHead>
                            <TableHead className="text-center font-bangla">বিলম্বে</TableHead>
                            <TableHead className="text-center font-bangla">ছুটি</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students?.map((student, index) => {
                            const status = attendanceData[student.id] || 'present';
                            return (
                              <motion.tr
                                key={student.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={status === 'absent' ? 'bg-red-50' : status === 'late' ? 'bg-yellow-50' : ''}
                              >
                                <TableCell className="font-medium">{student.roll_number}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                      {student.photo_url ? (
                                        <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                    <span className="font-bangla">{student.full_name_bn || student.full_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={status === 'present'}
                                    onCheckedChange={() => toggleAttendance(student.id, 'present')}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={status === 'absent'}
                                    onCheckedChange={() => toggleAttendance(student.id, 'absent')}
                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={status === 'late'}
                                    onCheckedChange={() => toggleAttendance(student.id, 'late')}
                                    className="data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={status === 'leave'}
                                    onCheckedChange={() => toggleAttendance(student.id, 'leave')}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                  />
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Biometric Logs */}
              <TabsContent value="biometric" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-bangla flex items-center gap-2">
                      <Fingerprint className="w-5 h-5" />
                      বায়োমেট্রিক উপস্থিতি লগ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {biometricLogs?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-bangla">রোল</TableHead>
                            <TableHead className="font-bangla">নাম</TableHead>
                            <TableHead className="font-bangla">সময়</TableHead>
                            <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {biometricLogs.map((log: any) => (
                            <TableRow key={log.id}>
                              <TableCell>{log.students?.roll_number}</TableCell>
                              <TableCell className="font-bangla">{log.students?.full_name_bn || log.students?.full_name}</TableCell>
                              <TableCell>
                                {log.biometric_timestamp && format(new Date(log.biometric_timestamp), 'hh:mm a', { locale: bn })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={log.status === 'present' ? 'default' : log.status === 'late' ? 'secondary' : 'destructive'}>
                                  {log.status === 'present' ? 'উপস্থিত' : log.status === 'late' ? 'বিলম্বে' : 'অনুপস্থিত'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground font-bangla">
                        <Fingerprint className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        এই তারিখে কোনো বায়োমেট্রিক লগ পাওয়া যায়নি
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
