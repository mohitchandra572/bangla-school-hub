import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle,
  Users, Award, TrendingUp
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  verified: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
};

const statusLabels: Record<string, string> = {
  pending: 'যাচাই বাকি',
  verified: 'যাচাইকৃত',
  rejected: 'প্রত্যাখ্যাত',
};

export default function ResultsVerification() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch exam details
  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  // Fetch grading rules
  const { data: gradingRules } = useQuery({
    queryKey: ['grading-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grading_rules')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch results with student info
  const { data: results, isLoading } = useQuery({
    queryKey: ['exam-results', examId, subjectFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('results')
        .select(`
          *,
          students (
            id, full_name, full_name_bn, roll_number, section
          )
        `)
        .eq('exam_id', examId);

      if (subjectFilter !== 'all') {
        query = query.eq('subject', subjectFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error } = await query.order('subject').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!examId,
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ resultIds, status }: { resultIds: string[]; status: string }) => {
      const { error } = await supabase
        .from('results')
        .update({
          verification_status: status,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .in('id', resultIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', examId] });
      toast.success('ফলাফল আপডেট হয়েছে');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Bulk verify all pending
  const handleVerifyAll = async () => {
    const pendingResults = results?.filter(r => r.verification_status === 'pending') || [];
    if (pendingResults.length === 0) {
      toast.error('কোনো যাচাই বাকি ফলাফল নেই');
      return;
    }
    await verifyMutation.mutateAsync({
      resultIds: pendingResults.map(r => r.id),
      status: 'verified',
    });
  };

  // Get grade for marks
  const getGrade = (marks: number, totalMarks: number) => {
    const percentage = (marks / totalMarks) * 100;
    const grade = gradingRules?.find(g => percentage >= g.min_marks && percentage <= g.max_marks);
    return grade;
  };

  const subjects = [...new Set(results?.map(r => r.subject).filter(Boolean))];

  const stats = {
    total: results?.length || 0,
    pending: results?.filter(r => r.verification_status === 'pending').length || 0,
    verified: results?.filter(r => r.verification_status === 'verified').length || 0,
    rejected: results?.filter(r => r.verification_status === 'rejected').length || 0,
  };

  // Group results by subject
  const resultsBySubject = results?.reduce((acc: Record<string, any[]>, result) => {
    const subject = result.subject || 'অন্যান্য';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(result);
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/exams')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-bangla">ফলাফল যাচাই</h1>
            {exam && (
              <p className="text-muted-foreground font-bangla mt-1">
                {exam.name_bn || exam.name} - {exam.class} শ্রেণী
              </p>
            )}
          </div>
          <Button
            onClick={handleVerifyAll}
            disabled={stats.pending === 0 || verifyMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            <span className="font-bangla">সব যাচাই করুন ({stats.pending})</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট ফলাফল</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">যাচাই বাকি</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">যাচাইকৃত</p>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">প্রত্যাখ্যাত</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="বিষয়" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব বিষয়</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s} value={s} className="font-bangla">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="অবস্থা" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব অবস্থা</SelectItem>
                  <SelectItem value="pending" className="font-bangla">যাচাই বাকি</SelectItem>
                  <SelectItem value="verified" className="font-bangla">যাচাইকৃত</SelectItem>
                  <SelectItem value="rejected" className="font-bangla">প্রত্যাখ্যাত</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results by Subject */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(resultsBySubject).length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground font-bangla">
                কোনো ফলাফল পাওয়া যায়নি
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={Object.keys(resultsBySubject)[0]} className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              {Object.keys(resultsBySubject).map(subject => (
                <TabsTrigger key={subject} value={subject} className="font-bangla">
                  {subject} ({resultsBySubject[subject].length})
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(resultsBySubject).map(([subject, subjectResults]) => (
              <TabsContent key={subject} value={subject}>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-bangla">{subject}</CardTitle>
                    <CardDescription className="font-bangla">
                      মোট {subjectResults.length}টি ফলাফল
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-bangla">রোল</TableHead>
                            <TableHead className="font-bangla">নাম</TableHead>
                            <TableHead className="font-bangla">সেকশন</TableHead>
                            <TableHead className="font-bangla">নম্বর</TableHead>
                            <TableHead className="font-bangla">গ্রেড</TableHead>
                            <TableHead className="font-bangla">অবস্থা</TableHead>
                            <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjectResults.map((result: any) => {
                            const grade = getGrade(
                              result.marks_obtained || 0,
                              result.total_marks || 100
                            );
                            return (
                              <TableRow key={result.id}>
                                <TableCell className="font-bangla">
                                  {result.students?.roll_number}
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium font-bangla">
                                    {result.students?.full_name_bn || result.students?.full_name}
                                  </p>
                                </TableCell>
                                <TableCell className="font-bangla">
                                  {result.students?.section}
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold">
                                    {result.marks_obtained}/{result.total_marks}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {grade && (
                                    <Badge className={grade.is_passing ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                                      {grade.grade_code} ({grade.grade_point})
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColors[result.verification_status || 'pending']}>
                                    {statusLabels[result.verification_status || 'pending']}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {result.verification_status !== 'verified' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => verifyMutation.mutate({
                                          resultIds: [result.id],
                                          status: 'verified',
                                        })}
                                        disabled={verifyMutation.isPending}
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                                        <span className="font-bangla">যাচাই</span>
                                      </Button>
                                    )}
                                    {result.verification_status !== 'rejected' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => verifyMutation.mutate({
                                          resultIds: [result.id],
                                          status: 'rejected',
                                        })}
                                        disabled={verifyMutation.isPending}
                                      >
                                        <XCircle className="w-4 h-4 mr-1 text-red-500" />
                                        <span className="font-bangla">প্রত্যাখ্যান</span>
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Grading Scale Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">গ্রেডিং স্কেল (বাংলাদেশ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {gradingRules?.map(grade => (
                <div
                  key={grade.id}
                  className={`px-4 py-2 rounded-lg border ${
                    grade.is_passing ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{grade.grade_code}</span>
                    <span className="text-sm text-muted-foreground">({grade.grade_point})</span>
                  </div>
                  <p className="text-sm font-bangla text-muted-foreground">
                    {grade.min_marks}-{grade.max_marks}% | {grade.remarks_bn}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
