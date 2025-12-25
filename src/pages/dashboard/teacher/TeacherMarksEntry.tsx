import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Award, Save, User, CheckCircle, AlertTriangle,
  Calculator, FileText, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function TeacherMarksEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marksData, setMarksData] = useState<Record<string, { obtained: number; remarks: string }>>({});

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

  // Fetch exams for assigned classes
  const { data: exams } = useQuery({
    queryKey: ['teacher-exams', teacher?.assigned_classes],
    queryFn: async () => {
      if (!teacher?.assigned_classes?.length) return [];
      
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .in('class', teacher.assigned_classes)
        .in('status', ['ongoing', 'completed'])
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!teacher?.assigned_classes?.length,
  });

  // Get selected exam details
  const selectedExamData = exams?.find(e => e.id === selectedExam);

  // Fetch exam routines (subjects)
  const { data: examRoutines } = useQuery({
    queryKey: ['exam-routines', selectedExam],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_routines')
        .select('*')
        .eq('exam_id', selectedExam)
        .order('exam_date');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExam,
  });

  // Get subjects from teacher or exam routines
  const subjects = teacher?.subjects_taught?.length 
    ? teacher.subjects_taught 
    : examRoutines?.map(r => r.subject) || [];

  const selectedRoutine = examRoutines?.find(r => r.subject === selectedSubject);

  // Fetch students for the exam class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['exam-students', selectedExamData?.class, selectedExamData?.section],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select('id, full_name, full_name_bn, roll_number, photo_url')
        .eq('class', selectedExamData?.class)
        .eq('status', 'active')
        .order('roll_number');

      if (selectedExamData?.section) {
        query = query.eq('section', selectedExamData.section);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExamData?.class,
  });

  // Fetch existing results
  const { data: existingResults, refetch: refetchResults } = useQuery({
    queryKey: ['existing-results', selectedExam, selectedSubject],
    queryFn: async () => {
      if (!students?.length) return [];
      
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('exam_id', selectedExam)
        .eq('subject', selectedSubject)
        .in('student_id', students.map(s => s.id));
      
      if (error) throw error;
      
      // Initialize marks data
      const initial: Record<string, { obtained: number; remarks: string }> = {};
      data?.forEach(r => {
        initial[r.student_id] = { obtained: r.marks_obtained || 0, remarks: r.remarks || '' };
      });
      setMarksData(initial);
      
      return data;
    },
    enabled: !!students?.length && !!selectedSubject,
  });

  // Fetch grading rules
  const { data: gradingRules } = useQuery({
    queryKey: ['grading-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grading_rules')
        .select('*')
        .eq('is_active', true)
        .order('min_marks', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate grade based on marks
  const getGrade = (marks: number, total: number) => {
    const percentage = (marks / total) * 100;
    const grade = gradingRules?.find(g => percentage >= g.min_marks && percentage <= g.max_marks);
    return grade ? { code: grade.grade_code, point: grade.grade_point, name: grade.grade_name_bn || grade.name } : null;
  };

  // Save marks mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalMarks = selectedRoutine?.total_marks || 100;
      
      const records = Object.entries(marksData).map(([studentId, data]) => {
        const grade = getGrade(data.obtained, totalMarks);
        return {
          student_id: studentId,
          exam_id: selectedExam,
          subject: selectedSubject,
          marks_obtained: data.obtained,
          total_marks: totalMarks,
          grade: grade?.code || null,
          remarks: data.remarks || null,
          verification_status: 'pending',
        };
      });

      for (const record of records) {
        const { error } = await supabase
          .from('results')
          .upsert(record, { onConflict: 'student_id,exam_id,subject' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('মার্কস সফলভাবে সংরক্ষিত হয়েছে');
      refetchResults();
    },
    onError: (error: any) => {
      toast.error(error.message || 'মার্কস সংরক্ষণে সমস্যা হয়েছে');
    },
  });

  // Submit for approval mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('results')
        .update({ verification_status: 'submitted' })
        .eq('exam_id', selectedExam)
        .eq('subject', selectedSubject);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('ফলাফল অনুমোদনের জন্য জমা দেওয়া হয়েছে');
      refetchResults();
    },
    onError: (error: any) => {
      toast.error(error.message || 'জমা দিতে সমস্যা হয়েছে');
    },
  });

  const updateMarks = (studentId: string, field: 'obtained' | 'remarks', value: any) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const totalMarks = selectedRoutine?.total_marks || 100;
  const stats = {
    entered: Object.keys(marksData).length,
    total: students?.length || 0,
    avgMarks: Object.values(marksData).length 
      ? Math.round(Object.values(marksData).reduce((sum, m) => sum + m.obtained, 0) / Object.values(marksData).length)
      : 0,
  };

  const isSubmitted = existingResults?.some(r => r.verification_status === 'submitted' || r.verification_status === 'verified');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Award className="w-7 h-7" />
              মার্কস এন্ট্রি
            </h1>
            <p className="text-muted-foreground font-bangla">
              পরীক্ষার ফলাফল প্রদান করুন
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium font-bangla">পরীক্ষা নির্বাচন</label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="পরীক্ষা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams?.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name_bn || exam.name} - {exam.class} শ্রেণি
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium font-bangla">বিষয় নির্বাচন</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedExam}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: string) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium font-bangla">পূর্ণ নম্বর</label>
                <Input value={totalMarks} disabled className="font-bangla" />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedExam && selectedSubject && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Calculator className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{stats.entered}/{stats.total}</p>
                  <p className="text-sm text-blue-600 font-bangla">এন্ট্রি সম্পন্ন</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <Award className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-700">{stats.avgMarks}</p>
                  <p className="text-sm text-green-600 font-bangla">গড় নম্বর</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{totalMarks}</p>
                  <p className="text-sm text-purple-600 font-bangla">পূর্ণ নম্বর</p>
                </CardContent>
              </Card>
            </div>

            {/* Marks Entry Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-bangla">নম্বর প্রদান করুন</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => saveMutation.mutate()} 
                    disabled={saveMutation.isPending || isSubmitted}
                    className="font-bangla"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                  </Button>
                  <Button 
                    onClick={() => submitMutation.mutate()} 
                    disabled={submitMutation.isPending || isSubmitted || stats.entered < stats.total}
                    className="font-bangla"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitted ? 'জমা দেওয়া হয়েছে' : 'অনুমোদনের জন্য জমা'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isSubmitted && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-bangla">এই বিষয়ের ফলাফল ইতিমধ্যে জমা দেওয়া হয়েছে।</span>
                  </div>
                )}
                
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
                        <TableHead className="w-32 font-bangla">প্রাপ্ত নম্বর</TableHead>
                        <TableHead className="w-24 font-bangla">গ্রেড</TableHead>
                        <TableHead className="font-bangla">মন্তব্য</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students?.map((student, index) => {
                        const marks = marksData[student.id]?.obtained || 0;
                        const grade = getGrade(marks, totalMarks);
                        const isPassing = gradingRules?.find(g => g.grade_code === grade?.code)?.is_passing ?? true;
                        
                        return (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={!isPassing ? 'bg-red-50' : ''}
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
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={totalMarks}
                                value={marksData[student.id]?.obtained || ''}
                                onChange={(e) => updateMarks(student.id, 'obtained', Number(e.target.value))}
                                disabled={isSubmitted}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              {grade ? (
                                <Badge variant={isPassing ? 'default' : 'destructive'}>
                                  {grade.code} ({grade.point})
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="মন্তব্য..."
                                value={marksData[student.id]?.remarks || ''}
                                onChange={(e) => updateMarks(student.id, 'remarks', e.target.value)}
                                disabled={isSubmitted}
                                className="font-bangla"
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
