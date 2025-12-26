import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Award, TrendingUp, TrendingDown, BookOpen, Star } from 'lucide-react';

export default function StudentResults() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<string>('all');

  // Fetch student info
  const { data: student } = useQuery({
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

  // Fetch all results for student
  const { data: results, isLoading } = useQuery({
    queryKey: ['student-results', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('*, exams(id, name, name_bn, exam_type, start_date)')
        .eq('student_id', student?.id)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
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
    }
  });

  // Get unique exams from results
  const uniqueExams = results?.reduce((acc: any[], result: any) => {
    if (result.exams && !acc.find(e => e.id === result.exams.id)) {
      acc.push(result.exams);
    }
    return acc;
  }, []) || [];

  // Filter results by selected exam
  const filteredResults = selectedExam === 'all' 
    ? results 
    : results?.filter(r => r.exam_id === selectedExam);

  // Calculate statistics for filtered results
  const examResults = filteredResults?.filter(r => r.exam_id === (selectedExam === 'all' ? filteredResults[0]?.exam_id : selectedExam)) || [];
  
  const totalMarks = examResults.reduce((sum, r) => sum + (r.total_marks || 0), 0);
  const obtainedMarks = examResults.reduce((sum, r) => sum + (r.marks_obtained || 0), 0);
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  
  // Calculate GPA
  const gradePoints = examResults.map(r => {
    const rule = gradingRules?.find(g => 
      r.marks_obtained !== null && 
      (r.marks_obtained / (r.total_marks || 100) * 100) >= g.min_marks && 
      (r.marks_obtained / (r.total_marks || 100) * 100) <= g.max_marks
    );
    return rule?.grade_point || 0;
  });
  const gpa = gradePoints.length > 0 
    ? (gradePoints.reduce((sum, gp) => sum + gp, 0) / gradePoints.length).toFixed(2)
    : '0.00';

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return <Badge variant="secondary">N/A</Badge>;
    
    const colors: Record<string, string> = {
      'A+': 'bg-green-500',
      'A': 'bg-green-400',
      'A-': 'bg-blue-500',
      'B+': 'bg-blue-400',
      'B': 'bg-yellow-500',
      'C': 'bg-orange-500',
      'D': 'bg-red-400',
      'F': 'bg-red-600'
    };
    
    return (
      <Badge className={`${colors[grade] || 'bg-secondary'} text-white`}>
        {grade}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">পরীক্ষার ফলাফল</h1>
            <p className="text-muted-foreground font-bangla">
              আপনার সকল প্রকাশিত পরীক্ষার ফলাফল
            </p>
          </div>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-[240px] font-bangla">
              <SelectValue placeholder="পরীক্ষা নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bangla">সকল পরীক্ষা</SelectItem>
              {uniqueExams.map((exam: any) => (
                <SelectItem key={exam.id} value={exam.id} className="font-bangla">
                  {exam.name_bn || exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        {filteredResults && filteredResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{examResults.length}</p>
                    <p className="text-sm text-muted-foreground font-bangla">বিষয়</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{obtainedMarks}/{totalMarks}</p>
                    <p className="text-sm text-muted-foreground font-bangla">প্রাপ্ত নম্বর</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${percentage >= 60 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {percentage >= 60 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                      {percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground font-bangla">শতাংশ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{gpa}</p>
                    <p className="text-sm text-muted-foreground font-bangla">জিপিএ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla flex items-center gap-2">
              <Award className="h-5 w-5" />
              বিষয়ভিত্তিক ফলাফল
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredResults && filteredResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-bangla">বিষয়</th>
                      <th className="text-left py-3 px-4 font-bangla">পরীক্ষা</th>
                      <th className="text-center py-3 px-4 font-bangla">প্রাপ্ত নম্বর</th>
                      <th className="text-center py-3 px-4 font-bangla">মোট নম্বর</th>
                      <th className="text-center py-3 px-4 font-bangla">গ্রেড</th>
                      <th className="text-left py-3 px-4 font-bangla">মন্তব্য</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result: any) => (
                      <tr key={result.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium font-bangla">{result.subject}</td>
                        <td className="py-3 px-4 text-muted-foreground font-bangla">
                          {result.exams?.name_bn || result.exams?.name}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {result.marks_obtained ?? '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {result.total_marks}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getGradeBadge(result.grade)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground font-bangla">
                          {result.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-bangla">
                  কোনো প্রকাশিত ফলাফল নেই
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grading Scale */}
        {gradingRules && gradingRules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">গ্রেডিং স্কেল</CardTitle>
              <CardDescription className="font-bangla">
                নম্বর অনুযায়ী গ্রেড ও গ্রেড পয়েন্ট
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {gradingRules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className="text-center p-3 bg-muted/50 rounded-lg"
                  >
                    <p className="font-bold text-lg">{rule.grade_code}</p>
                    <p className="text-sm text-muted-foreground">{rule.min_marks}-{rule.max_marks}%</p>
                    <p className="text-xs text-primary">GP: {rule.grade_point}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
