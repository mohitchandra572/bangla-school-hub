import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  ArrowLeft, FileText, Download, CheckCircle2, XCircle, AlertCircle,
  Users, Printer, QrCode, CreditCard
} from 'lucide-react';
import { AdmitCardPreview } from '@/components/exam/AdmitCardPreview';

interface StudentEligibility {
  student: any;
  fees_cleared: boolean;
  documents_complete: boolean;
  is_active: boolean;
  admit_card?: any;
}

export default function AdmitCardGeneration() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sectionFilter, setSectionFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [previewStudent, setPreviewStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Fetch exam routines
  const { data: routines } = useQuery({
    queryKey: ['exam-routines', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_routines')
        .select('*')
        .eq('exam_id', examId)
        .order('exam_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!examId,
  });

  // Fetch students with eligibility check
  const { data: eligibilityData, isLoading } = useQuery({
    queryKey: ['student-eligibility', examId, exam?.class, sectionFilter],
    queryFn: async () => {
      if (!exam?.class) return [];

      // Fetch students
      let studentsQuery = supabase
        .from('students')
        .select('*')
        .eq('class', exam.class)
        .eq('status', 'active');

      if (sectionFilter !== 'all') {
        studentsQuery = studentsQuery.eq('section', sectionFilter);
      }

      const { data: students, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      // Fetch existing admit cards
      const { data: existingCards } = await supabase
        .from('admit_cards')
        .select('*')
        .eq('exam_id', examId);

      // Check fees for each student
      const eligibilityResults: StudentEligibility[] = await Promise.all(
        (students || []).map(async (student) => {
          // Check pending fees
          const { data: pendingFees } = await supabase
            .from('fees')
            .select('id')
            .eq('student_id', student.id)
            .eq('status', 'pending')
            .limit(1);

          const fees_cleared = !pendingFees || pendingFees.length === 0;
          const documents_complete = !!student.birth_certificate_no; // Example check
          const is_active = student.status === 'active';
          const admit_card = existingCards?.find(c => c.student_id === student.id);

          return {
            student,
            fees_cleared,
            documents_complete,
            is_active,
            admit_card,
          };
        })
      );

      return eligibilityResults;
    },
    enabled: !!exam?.class && !!examId,
  });

  // Generate admit cards mutation
  const generateMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const admitCards = studentIds.map((studentId, index) => ({
        exam_id: examId,
        student_id: studentId,
        admit_number: `${exam?.academic_year || new Date().getFullYear()}-${exam?.class?.replace(/[^\d]/g, '') || '0'}-${String(index + 1).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`,
        qr_code_data: JSON.stringify({ examId, studentId, timestamp: Date.now() }),
        eligibility_status: 'eligible',
        fees_cleared: true,
        documents_complete: true,
        generated_by: user?.id,
      }));

      const { error } = await supabase
        .from('admit_cards')
        .upsert(admitCards, { onConflict: 'exam_id,student_id' });

      if (error) throw error;
      return admitCards.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['student-eligibility'] });
      toast.success(`${count}টি এডমিট কার্ড তৈরি হয়েছে`);
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'এডমিট কার্ড তৈরি করতে সমস্যা হয়েছে');
    },
  });

  const eligibleStudents = eligibilityData?.filter(e => e.fees_cleared && e.is_active) || [];
  const ineligibleStudents = eligibilityData?.filter(e => !e.fees_cleared || !e.is_active) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(eligibleStudents.filter(e => !e.admit_card).map(e => e.student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleGenerateSelected = async () => {
    if (selectedStudents.length === 0) {
      toast.error('শিক্ষার্থী নির্বাচন করুন');
      return;
    }
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync(selectedStudents);
    } finally {
      setIsGenerating(false);
    }
  };

  const sections = [...new Set(eligibilityData?.map(e => e.student.section).filter(Boolean))];

  const stats = {
    total: eligibilityData?.length || 0,
    eligible: eligibleStudents.length,
    ineligible: ineligibleStudents.length,
    generated: eligibilityData?.filter(e => e.admit_card).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/exams')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-bangla">এডমিট কার্ড</h1>
            {exam && (
              <p className="text-muted-foreground font-bangla mt-1">
                {exam.name_bn || exam.name} - {exam.class} শ্রেণী
              </p>
            )}
          </div>
          <Button
            onClick={handleGenerateSelected}
            disabled={selectedStudents.length === 0 || isGenerating}
          >
            <FileText className="w-4 h-4 mr-2" />
            <span className="font-bangla">
              {isGenerating ? 'তৈরি হচ্ছে...' : `${selectedStudents.length}টি এডমিট কার্ড তৈরি`}
            </span>
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
                  <p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষার্থী</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-sm text-muted-foreground font-bangla">যোগ্য</p>
                  <p className="text-2xl font-bold">{stats.eligible}</p>
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
                  <p className="text-sm text-muted-foreground font-bangla">অযোগ্য</p>
                  <p className="text-2xl font-bold">{stats.ineligible}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">তৈরিকৃত</p>
                  <p className="text-2xl font-bold">{stats.generated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="সেকশন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব সেকশন</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s} value={s} className="font-bangla">{s} সেকশন</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">যোগ্য শিক্ষার্থী</CardTitle>
            <CardDescription className="font-bangla">
              ফি পরিশোধিত ও সক্রিয় শিক্ষার্থীদের তালিকা
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : eligibleStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো যোগ্য শিক্ষার্থী পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedStudents.length === eligibleStudents.filter(e => !e.admit_card).length && eligibleStudents.filter(e => !e.admit_card).length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-bangla">রোল</TableHead>
                      <TableHead className="font-bangla">নাম</TableHead>
                      <TableHead className="font-bangla">সেকশন</TableHead>
                      <TableHead className="font-bangla">ফি</TableHead>
                      <TableHead className="font-bangla">অবস্থা</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleStudents.map(({ student, fees_cleared, admit_card }) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                            disabled={!!admit_card}
                          />
                        </TableCell>
                        <TableCell className="font-bangla">{student.roll_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium font-bangla">{student.full_name_bn || student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.admission_id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bangla">{student.section}</TableCell>
                        <TableCell>
                          <Badge className={fees_cleared ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                            {fees_cleared ? 'পরিশোধিত' : 'বকেয়া'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {admit_card ? (
                            <Badge className="bg-blue-500/10 text-blue-600 font-bangla">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              তৈরি
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-bangla">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              তৈরি হয়নি
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {admit_card && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewStudent({ student, admit_card })}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                <span className="font-bangla">প্রিন্ট</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ineligible Students */}
        {ineligibleStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla text-destructive">অযোগ্য শিক্ষার্থী</CardTitle>
              <CardDescription className="font-bangla">
                ফি বকেয়া বা নিষ্ক্রিয় শিক্ষার্থীদের তালিকা
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
                      <TableHead className="font-bangla">কারণ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ineligibleStudents.map(({ student, fees_cleared, is_active }) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-bangla">{student.roll_number}</TableCell>
                        <TableCell>
                          <p className="font-medium font-bangla">{student.full_name_bn || student.full_name}</p>
                        </TableCell>
                        <TableCell className="font-bangla">{student.section}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!fees_cleared && (
                              <Badge className="bg-red-500/10 text-red-600 font-bangla">ফি বকেয়া</Badge>
                            )}
                            {!is_active && (
                              <Badge className="bg-gray-500/10 text-gray-600 font-bangla">নিষ্ক্রিয়</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewStudent} onOpenChange={() => setPreviewStudent(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-bangla">এডমিট কার্ড প্রিভিউ</DialogTitle>
            </DialogHeader>
            {previewStudent && exam && routines && (
              <AdmitCardPreview
                student={previewStudent.student}
                exam={exam}
                routines={routines}
                admitCard={previewStudent.admit_card}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
