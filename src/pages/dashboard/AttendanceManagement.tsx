import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CheckCircle, XCircle, Clock, Save, Download } from 'lucide-react';
import { format } from 'date-fns';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const sections = ['ক', 'খ', 'গ', 'ঘ'];

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function AttendanceManagement() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-for-attendance', selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass) return [];
      let query = supabase.from('students').select('*').eq('class', selectedClass).eq('status', 'active').order('roll_number');
      if (selectedSection) query = query.eq('section', selectedSection);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const { data: existingAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedSection, selectedDate],
    queryFn: async () => {
      if (!selectedClass || !students?.length) return {};
      const studentIds = students.map(s => s.id);
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .in('student_id', studentIds)
        .eq('date', selectedDate);
      if (error) throw error;
      const record: Record<string, AttendanceStatus> = {};
      data?.forEach(a => { record[a.student_id] = a.status as AttendanceStatus; });
      return record;
    },
    enabled: !!selectedClass && !!students?.length,
  });

  // Sync existing attendance to state
  useState(() => {
    if (existingAttendance) setAttendance(existingAttendance);
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!students?.length) return;
      
      const records = students.map(student => ({
        student_id: student.id,
        date: selectedDate,
        status: attendance[student.id] || 'present',
        marked_by: user?.id,
      }));

      // Delete existing and insert new (upsert approach)
      const studentIds = students.map(s => s.id);
      await supabase.from('attendance').delete().in('student_id', studentIds).eq('date', selectedDate);
      
      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'সফল!', description: 'উপস্থিতি সংরক্ষণ করা হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => {
      const current = prev[studentId] || 'present';
      const next: AttendanceStatus = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
      return { ...prev, [studentId]: next };
    });
  };

  const markAll = (status: AttendanceStatus) => {
    if (!students?.length) return;
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => { newAttendance[s.id] = status; });
    setAttendance(newAttendance);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <Badge className="bg-secondary text-secondary-foreground font-bangla"><CheckCircle className="w-3 h-3 mr-1" />উপস্থিত</Badge>;
      case 'absent': return <Badge variant="destructive" className="font-bangla"><XCircle className="w-3 h-3 mr-1" />অনুপস্থিত</Badge>;
      case 'late': return <Badge className="bg-accent text-accent-foreground font-bangla"><Clock className="w-3 h-3 mr-1" />বিলম্বে</Badge>;
    }
  };

  const stats = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">উপস্থিতি ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">শিক্ষার্থীদের দৈনিক উপস্থিতি নিন</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block font-bangla">তারিখ</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block font-bangla">ক্লাস *</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger><SelectValue placeholder="ক্লাস নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c} শ্রেণী</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block font-bangla">সেকশন</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger><SelectValue placeholder="সেকশন" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল</SelectItem>
                    {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => saveMutation.mutate()} disabled={!students?.length || saveMutation.isPending} className="btn-accent font-bangla flex-1">
                  <Save className="w-4 h-4 mr-2" /> সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClass && students && students.length > 0 && (
          <>
            {/* Stats & Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{students.length}</p><p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষার্থী</p></CardContent></Card>
              <Card className="bg-secondary/10"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-secondary">{stats.present}</p><p className="text-sm text-muted-foreground font-bangla">উপস্থিত</p></CardContent></Card>
              <Card className="bg-destructive/10"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.absent}</p><p className="text-sm text-muted-foreground font-bangla">অনুপস্থিত</p></CardContent></Card>
              <Card className="bg-accent/10"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-accent">{stats.late}</p><p className="text-sm text-muted-foreground font-bangla">বিলম্বে</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{students.length > 0 ? Math.round((stats.present / students.length) * 100) : 0}%</p><p className="text-sm text-muted-foreground font-bangla">উপস্থিতি হার</p></CardContent></Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll('present')} className="font-bangla"><CheckCircle className="w-4 h-4 mr-1" /> সবাইকে উপস্থিত</Button>
              <Button variant="outline" size="sm" onClick={() => markAll('absent')} className="font-bangla"><XCircle className="w-4 h-4 mr-1" /> সবাইকে অনুপস্থিত</Button>
            </div>

            {/* Attendance Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 font-bangla">রোল</TableHead>
                      <TableHead className="font-bangla">শিক্ষার্থীর নাম</TableHead>
                      <TableHead className="font-bangla">সেকশন</TableHead>
                      <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                        <TableCell className="font-bangla">{student.full_name_bn || student.full_name}</TableCell>
                        <TableCell>{student.section || '-'}</TableCell>
                        <TableCell>{getStatusBadge(attendance[student.id] || existingAttendance?.[student.id] || 'present')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => toggleAttendance(student.id)} className="font-bangla">
                            পরিবর্তন করুন
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
      </div>
    </DashboardLayout>
  );
}
