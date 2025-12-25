import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Save, Check, X } from 'lucide-react';

const subjects = ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'সমাজ', 'ধর্ম', 'তথ্যপ্রযুক্তি'];

const calculateGrade = (marks: number, total: number) => {
  const percentage = (marks / total) * 100;
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'A-';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
};

export default function ResultsEntry() {
  const { examId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [results, setResults] = useState<Record<string, { marks: number; total: number }>>({});

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students-for-results', exam?.class],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', exam?.class)
        .eq('status', 'active')
        .order('roll_number');
      if (error) throw error;
      return data;
    },
    enabled: !!exam?.class,
  });

  const { data: existingResults } = useQuery({
    queryKey: ['results', examId, selectedSubject],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('exam_id', examId)
        .eq('subject', selectedSubject);
      if (error) throw error;
      return data;
    },
    enabled: !!examId && !!selectedSubject,
  });

  // Initialize results from existing data
  useState(() => {
    if (existingResults) {
      const initialResults: Record<string, { marks: number; total: number }> = {};
      existingResults.forEach(r => {
        initialResults[r.student_id] = { marks: Number(r.marks_obtained) || 0, total: Number(r.total_marks) || 100 };
      });
      setResults(initialResults);
    }
  });

  const saveResultsMutation = useMutation({
    mutationFn: async () => {
      const resultsToSave = Object.entries(results).map(([studentId, { marks, total }]) => ({
        exam_id: examId,
        student_id: studentId,
        subject: selectedSubject,
        marks_obtained: marks,
        total_marks: total,
        grade: calculateGrade(marks, total),
      }));

      // Upsert results
      for (const result of resultsToSave) {
        const { error } = await supabase
          .from('results')
          .upsert(result, { onConflict: 'exam_id,student_id,subject' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', examId] });
      toast({ title: 'সফল!', description: 'ফলাফল সংরক্ষিত হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const handleMarksChange = (studentId: string, marks: number, total: number = 100) => {
    setResults(prev => ({
      ...prev,
      [studentId]: { marks: Math.min(marks, total), total },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">ফলাফল প্রদান</h1>
            <p className="text-muted-foreground font-bangla">
              {exam?.name_bn || exam?.name} • {exam?.class} শ্রেণী
            </p>
          </div>
          <div className="flex gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48 font-bangla">
                <SelectValue placeholder="বিষয় নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => saveResultsMutation.mutate()} 
              disabled={!selectedSubject || Object.keys(results).length === 0}
              className="font-bangla"
            >
              <Save className="w-4 h-4 mr-2" /> সংরক্ষণ
            </Button>
          </div>
        </div>

        {!selectedSubject ? (
          <div className="text-center py-20 text-muted-foreground font-bangla">
            ফলাফল প্রদানের জন্য প্রথমে বিষয় নির্বাচন করুন
          </div>
        ) : isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla w-20">রোল</TableHead>
                  <TableHead className="font-bangla">নাম</TableHead>
                  <TableHead className="font-bangla w-32">প্রাপ্ত নম্বর</TableHead>
                  <TableHead className="font-bangla w-24">পূর্ণমান</TableHead>
                  <TableHead className="font-bangla w-20">গ্রেড</TableHead>
                  <TableHead className="font-bangla w-20">স্ট্যাটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => {
                  const result = results[student.id];
                  const grade = result ? calculateGrade(result.marks, result.total) : '-';
                  const isPassing = grade !== 'F' && grade !== '-';

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-bangla font-medium">{student.roll_number}</TableCell>
                      <TableCell className="font-bangla">{student.full_name_bn || student.full_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={result?.total || 100}
                          value={result?.marks || ''}
                          onChange={(e) => handleMarksChange(student.id, Number(e.target.value), result?.total || 100)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={result?.total || 100}
                          onChange={(e) => handleMarksChange(student.id, result?.marks || 0, Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          grade === 'A+' ? 'bg-green-100 text-green-700' :
                          grade === 'A' || grade === 'A-' ? 'bg-blue-100 text-blue-700' :
                          grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                          grade === 'F' ? 'bg-red-100 text-red-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {grade}
                        </span>
                      </TableCell>
                      <TableCell>
                        {result ? (
                          isPassing ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <X className="w-5 h-5 text-red-600" />
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
