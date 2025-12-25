import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, MapPin } from 'lucide-react';

const defaultSubjects = [
  { en: 'Bangla', bn: 'বাংলা' },
  { en: 'English', bn: 'ইংরেজি' },
  { en: 'Mathematics', bn: 'গণিত' },
  { en: 'Science', bn: 'বিজ্ঞান' },
  { en: 'Social Science', bn: 'সমাজ বিজ্ঞান' },
  { en: 'Religion', bn: 'ধর্ম' },
  { en: 'ICT', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
  { en: 'Physical Education', bn: 'শারীরিক শিক্ষা' },
  { en: 'Arts', bn: 'চারু ও কারুকলা' },
  { en: 'Agriculture', bn: 'কৃষি শিক্ষা' },
  { en: 'Home Science', bn: 'গার্হস্থ্য বিজ্ঞান' },
  { en: 'Physics', bn: 'পদার্থবিজ্ঞান' },
  { en: 'Chemistry', bn: 'রসায়ন' },
  { en: 'Biology', bn: 'জীববিজ্ঞান' },
  { en: 'Higher Math', bn: 'উচ্চতর গণিত' },
];

interface RoutineFormData {
  subject: string;
  subject_bn: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string;
  total_marks: number;
}

export default function ExamRoutineManagement() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [formData, setFormData] = useState<RoutineFormData>({
    subject: '',
    subject_bn: '',
    exam_date: '',
    start_time: '09:00',
    end_time: '12:00',
    room_no: '',
    total_marks: 100,
  });

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

  // Fetch routines
  const { data: routines, isLoading } = useQuery({
    queryKey: ['exam-routines', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_routines')
        .select('*')
        .eq('exam_id', examId)
        .order('exam_date', { ascending: true })
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!examId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RoutineFormData) => {
      const { error } = await supabase.from('exam_routines').insert([{
        exam_id: examId,
        ...data,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-routines', examId] });
      toast.success('রুটিন যোগ হয়েছে');
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'রুটিন যোগ করতে সমস্যা হয়েছে');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoutineFormData }) => {
      const { error } = await supabase.from('exam_routines').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-routines', examId] });
      toast.success('রুটিন আপডেট হয়েছে');
      resetForm();
      setIsOpen(false);
      setEditingRoutine(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exam_routines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-routines', examId] });
      toast.success('রুটিন মুছে ফেলা হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      subject_bn: '',
      exam_date: '',
      start_time: '09:00',
      end_time: '12:00',
      room_no: '',
      total_marks: 100,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoutine) {
      updateMutation.mutate({ id: editingRoutine.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (routine: any) => {
    setEditingRoutine(routine);
    setFormData({
      subject: routine.subject || '',
      subject_bn: routine.subject_bn || '',
      exam_date: routine.exam_date || '',
      start_time: routine.start_time || '09:00',
      end_time: routine.end_time || '12:00',
      room_no: routine.room_no || '',
      total_marks: routine.total_marks || 100,
    });
    setIsOpen(true);
  };

  const handleSubjectSelect = (subject: typeof defaultSubjects[0]) => {
    setFormData(prev => ({
      ...prev,
      subject: subject.en,
      subject_bn: subject.bn,
    }));
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
            <h1 className="text-3xl font-bold font-bangla">পরীক্ষার রুটিন</h1>
            {exam && (
              <p className="text-muted-foreground font-bangla mt-1">
                {exam.name_bn || exam.name} - {exam.class} শ্রেণী
              </p>
            )}
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) { setEditingRoutine(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-bangla">রুটিন যোগ</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingRoutine ? 'রুটিন সম্পাদনা' : 'নতুন রুটিন যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="font-bangla">বিষয় নির্বাচন</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                    {defaultSubjects.map(subject => (
                      <Button
                        key={subject.en}
                        type="button"
                        variant={formData.subject === subject.en ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSubjectSelect(subject)}
                        className="font-bangla"
                      >
                        {subject.bn}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">বিষয় (ইংরেজি)</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">বিষয় (বাংলা)</Label>
                    <Input
                      value={formData.subject_bn}
                      onChange={(e) => setFormData({...formData, subject_bn: e.target.value})}
                      className="font-bangla"
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-bangla">পরীক্ষার তারিখ</Label>
                  <Input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">শুরুর সময়</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">শেষের সময়</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">কক্ষ নম্বর</Label>
                    <Input
                      value={formData.room_no}
                      onChange={(e) => setFormData({...formData, room_no: e.target.value})}
                      placeholder="যেমন: ১০১, ২০২"
                      className="font-bangla"
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">পূর্ণমান</Label>
                    <Input
                      type="number"
                      value={formData.total_marks}
                      onChange={(e) => setFormData({...formData, total_marks: parseInt(e.target.value) || 100})}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    <span className="font-bangla">বাতিল</span>
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    <span className="font-bangla">{editingRoutine ? 'আপডেট' : 'যোগ করুন'}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Routine Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">পরীক্ষার সময়সূচী</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : routines?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো রুটিন যোগ করা হয়নি। উপরের "রুটিন যোগ" বাটনে ক্লিক করুন।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">বিষয়</TableHead>
                      <TableHead className="font-bangla">তারিখ</TableHead>
                      <TableHead className="font-bangla">সময়</TableHead>
                      <TableHead className="font-bangla">কক্ষ</TableHead>
                      <TableHead className="font-bangla">পূর্ণমান</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routines?.map((routine: any) => (
                      <TableRow key={routine.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium font-bangla">{routine.subject_bn || routine.subject}</p>
                            <p className="text-sm text-muted-foreground">{routine.subject}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(routine.exam_date), 'dd MMM yyyy', { locale: bn })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{routine.start_time} - {routine.end_time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {routine.room_no && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bangla">{routine.room_no}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bangla">{routine.total_marks}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(routine)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                if (confirm('এই রুটিন মুছে ফেলতে চান?')) {
                                  deleteMutation.mutate(routine.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
