import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Calendar, Clock, FileText, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const examTypes = ['প্রথম সাময়িক', 'দ্বিতীয় সাময়িক', 'বার্ষিক', 'টেস্ট'];

export default function ExamsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newExam, setNewExam] = useState({
    name: '', name_bn: '', class: '', exam_type: '', start_date: '', end_date: '', academic_year: '২০২৬'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (exam: typeof newExam) => {
      const { error } = await supabase.from('exams').insert([exam]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setShowCreateDialog(false);
      setNewExam({ name: '', name_bn: '', class: '', exam_type: '', start_date: '', end_date: '', academic_year: '২০২৬' });
      toast({ title: 'সফল!', description: 'পরীক্ষা তৈরি হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast({ title: 'সফল!', description: 'পরীক্ষা মুছে ফেলা হয়েছে' });
    },
  });

  const filteredExams = exams?.filter(exam => {
    const matchesSearch = exam.name_bn?.includes(searchTerm) || exam.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || exam.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming': return <Badge className="bg-blue-500">আসন্ন</Badge>;
      case 'ongoing': return <Badge className="bg-green-500">চলমান</Badge>;
      case 'completed': return <Badge className="bg-muted text-muted-foreground">সম্পন্ন</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">পরীক্ষা ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">পরীক্ষা তৈরি, প্রশ্নপত্র ও ফলাফল</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="font-bangla">
            <Plus className="w-4 h-4 mr-2" /> নতুন পরীক্ষা
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="পরীক্ষা খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-bangla"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full md:w-48 font-bangla">
              <SelectValue placeholder="শ্রেণী" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল শ্রেণী</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>{c} শ্রেণী</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Exams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border animate-pulse h-48" />
            ))
          ) : filteredExams?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground font-bangla">
              কোনো পরীক্ষা পাওয়া যায়নি
            </div>
          ) : (
            filteredExams?.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-6 border shadow-soft hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg font-bangla">{exam.name_bn || exam.name}</h3>
                    <p className="text-sm text-muted-foreground font-bangla">{exam.class} শ্রেণী • {exam.exam_type}</p>
                  </div>
                  {getStatusBadge(exam.status || 'upcoming')}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-bangla">শুরু: {new Date(exam.start_date).toLocaleDateString('bn-BD')}</span>
                  </div>
                  {exam.end_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-bangla">শেষ: {new Date(exam.end_date).toLocaleDateString('bn-BD')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link to={`/dashboard/exams/${exam.id}/papers`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full font-bangla">
                      <FileText className="w-4 h-4 mr-1" /> প্রশ্নপত্র
                    </Button>
                  </Link>
                  <Link to={`/dashboard/exams/${exam.id}/results`}>
                    <Button variant="outline" size="sm" className="font-bangla">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteExamMutation.mutate(exam.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create Exam Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-bangla">নতুন পরীক্ষা তৈরি</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-bangla">পরীক্ষার নাম (বাংলা)</Label>
                <Input
                  value={newExam.name_bn}
                  onChange={(e) => setNewExam({ ...newExam, name_bn: e.target.value, name: e.target.value })}
                  placeholder="যেমন: প্রথম সাময়িক পরীক্ষা ২০২৬"
                  className="font-bangla"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">শ্রেণী</Label>
                  <Select value={newExam.class} onValueChange={(v) => setNewExam({ ...newExam, class: v })}>
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="শ্রেণী" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">পরীক্ষার ধরন</Label>
                  <Select value={newExam.exam_type} onValueChange={(v) => setNewExam({ ...newExam, exam_type: v })}>
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="ধরন" /></SelectTrigger>
                    <SelectContent>
                      {examTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">শুরুর তারিখ</Label>
                  <Input
                    type="date"
                    value={newExam.start_date}
                    onChange={(e) => setNewExam({ ...newExam, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="font-bangla">শেষ তারিখ</Label>
                  <Input
                    type="date"
                    value={newExam.end_date}
                    onChange={(e) => setNewExam({ ...newExam, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="font-bangla">বাতিল</Button>
              <Button 
                onClick={() => createExamMutation.mutate(newExam)} 
                disabled={!newExam.name_bn || !newExam.class || !newExam.exam_type || !newExam.start_date}
                className="font-bangla"
              >
                তৈরি করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
