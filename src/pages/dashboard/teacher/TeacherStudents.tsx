import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Search, User, Phone, Mail, Calendar,
  Eye, MessageSquare, Award, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

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

  // Fetch students for assigned classes
  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', teacher?.assigned_classes, selectedClass, selectedSection, search],
    queryFn: async () => {
      if (!teacher?.assigned_classes?.length) return [];
      
      let query = supabase
        .from('students')
        .select('*')
        .in('class', teacher.assigned_classes)
        .eq('status', 'active')
        .order('roll_number');

      if (selectedClass) {
        query = query.eq('class', selectedClass);
      }
      if (selectedSection) {
        query = query.eq('section', selectedSection);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,full_name_bn.ilike.%${search}%,roll_number.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!teacher?.assigned_classes?.length,
  });

  // Fetch attendance for selected student
  const { data: studentAttendance } = useQuery({
    queryKey: ['student-attendance-summary', selectedStudent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', selectedStudent.id);
      
      const total = data?.length || 0;
      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      
      return { total, present, absent, percentage: total ? Math.round((present / total) * 100) : 0 };
    },
    enabled: !!selectedStudent?.id,
  });

  const classes = teacher?.assigned_classes || [];
  const sections = teacher?.assigned_sections || ['ক', 'খ', 'গ'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Users className="w-7 h-7" />
              আমার শিক্ষার্থীগণ
            </h1>
            <p className="text-muted-foreground font-bangla">
              আপনার অ্যাসাইনড ক্লাসের শিক্ষার্থীদের তালিকা
            </p>
          </div>
          <Badge variant="outline" className="font-bangla self-start">
            মোট: {students?.length || 0} জন
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 font-bangla"
                />
              </div>
              <Select
                value={selectedClass || 'all'}
                onValueChange={(val) => setSelectedClass(val === 'all' ? '' : val)}
              >
                <SelectTrigger className="font-bangla">
                  <SelectValue placeholder="শ্রেণি নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল শ্রেণি</SelectItem>
                  {classes.map((cls: string) => (
                    <SelectItem key={cls} value={cls}>{cls} শ্রেণি</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedSection || 'all'}
                onValueChange={(val) => setSelectedSection(val === 'all' ? '' : val)}
              >
                <SelectTrigger className="font-bangla">
                  <SelectValue placeholder="শাখা নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল শাখা</SelectItem>
                  {sections.map((sec: string) => (
                    <SelectItem key={sec} value={sec}>{sec} শাখা</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => { setSearch(''); setSelectedClass(''); setSelectedSection(''); }} className="font-bangla">
                রিসেট
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-muted-foreground font-bangla">লোড হচ্ছে...</p>
              </div>
            ) : students?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-bangla">
                কোনো শিক্ষার্থী পাওয়া যায়নি
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bangla">রোল</TableHead>
                    <TableHead className="font-bangla">নাম</TableHead>
                    <TableHead className="font-bangla">শ্রেণি</TableHead>
                    <TableHead className="font-bangla">শাখা</TableHead>
                    <TableHead className="font-bangla">অভিভাবক</TableHead>
                    <TableHead className="font-bangla">যোগাযোগ</TableHead>
                    <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group"
                    >
                      <TableCell className="font-medium">{student.roll_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {student.photo_url ? (
                              <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium font-bangla">{student.full_name_bn || student.full_name}</p>
                            {student.full_name_bn && (
                              <p className="text-xs text-muted-foreground">{student.full_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bangla">{student.class}</TableCell>
                      <TableCell className="font-bangla">{student.section || '-'}</TableCell>
                      <TableCell className="font-bangla">{student.guardian_name_bn || student.guardian_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {student.guardian_mobile && (
                            <a href={`tel:${student.guardian_mobile}`} className="text-muted-foreground hover:text-primary">
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {student.email && (
                            <a href={`mailto:${student.email}`} className="text-muted-foreground hover:text-primary">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(student)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-bangla flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedStudent?.photo_url ? (
                    <img src={selectedStudent.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                {selectedStudent?.full_name_bn || selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedStudent && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-bangla">রোল নম্বর</p>
                    <p className="font-medium">{selectedStudent.roll_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-bangla">শ্রেণি ও শাখা</p>
                    <p className="font-medium font-bangla">{selectedStudent.class} শ্রেণি, {selectedStudent.section || '-'} শাখা</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-bangla">অভিভাবক</p>
                    <p className="font-medium font-bangla">{selectedStudent.guardian_name_bn || selectedStudent.guardian_name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-bangla">যোগাযোগ</p>
                    <p className="font-medium">{selectedStudent.guardian_mobile || '-'}</p>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium font-bangla mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> উপস্থিতি সারাংশ
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{studentAttendance?.percentage || 0}%</p>
                      <p className="text-xs text-muted-foreground font-bangla">উপস্থিতি হার</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{studentAttendance?.present || 0}</p>
                      <p className="text-xs text-muted-foreground font-bangla">উপস্থিত</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{studentAttendance?.absent || 0}</p>
                      <p className="text-xs text-muted-foreground font-bangla">অনুপস্থিত</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{studentAttendance?.total || 0}</p>
                      <p className="text-xs text-muted-foreground font-bangla">মোট দিন</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 font-bangla">
                    <MessageSquare className="w-4 h-4 mr-2" /> অভিভাবককে মেসেজ
                  </Button>
                  <Button variant="outline" className="flex-1 font-bangla">
                    <Award className="w-4 h-4 mr-2" /> ফলাফল দেখুন
                  </Button>
                  <Button variant="outline" className="flex-1 font-bangla">
                    <FileText className="w-4 h-4 mr-2" /> প্রোফাইল
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
