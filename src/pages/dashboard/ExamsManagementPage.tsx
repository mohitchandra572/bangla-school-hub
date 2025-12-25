import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Search, FileText, Calendar, 
  ClipboardList, Award, Users, CheckCircle2, Clock, Play
} from 'lucide-react';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const examTypes = [
  { value: 'class_test', label: 'ক্লাস টেস্ট' },
  { value: 'monthly', label: 'মাসিক পরীক্ষা' },
  { value: 'quarterly', label: 'ত্রৈমাসিক পরীক্ষা' },
  { value: 'half_yearly', label: 'অর্ধবার্ষিক পরীক্ষা' },
  { value: 'annual', label: 'বার্ষিক পরীক্ষা' },
  { value: 'pre_test', label: 'প্রি-টেস্ট' },
];

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-500/10 text-blue-600',
  ongoing: 'bg-green-500/10 text-green-600',
  completed: 'bg-gray-500/10 text-gray-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

const statusLabels: Record<string, string> = {
  upcoming: 'আসন্ন',
  ongoing: 'চলমান',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
};

export default function ExamsManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    exam_type: 'monthly',
    class: '',
    start_date: '',
    end_date: '',
    academic_year: new Date().getFullYear().toString(),
    status: 'upcoming',
  });

  // Fetch exams
  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', searchTerm, classFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('exams')
        .select('*')
        .order('start_date', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,name_bn.ilike.%${searchTerm}%`);
      }
      if (classFilter !== 'all') {
        query = query.eq('class', classFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('exams').insert([{
        ...data,
        end_date: data.end_date || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('পরীক্ষা সফলভাবে যোগ হয়েছে');
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'পরীক্ষা যোগ করতে সমস্যা হয়েছে');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('exams').update({
        ...data,
        end_date: data.end_date || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('পরীক্ষা আপডেট হয়েছে');
      resetForm();
      setIsOpen(false);
      setEditingExam(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('পরীক্ষা মুছে ফেলা হয়েছে');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('exams').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('অবস্থা পরিবর্তন হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_bn: '',
      exam_type: 'monthly',
      class: '',
      start_date: '',
      end_date: '',
      academic_year: new Date().getFullYear().toString(),
      status: 'upcoming',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExam) {
      updateMutation.mutate({ id: editingExam.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name || '',
      name_bn: exam.name_bn || '',
      exam_type: exam.exam_type || 'monthly',
      class: exam.class || '',
      start_date: exam.start_date || '',
      end_date: exam.end_date || '',
      academic_year: exam.academic_year || new Date().getFullYear().toString(),
      status: exam.status || 'upcoming',
    });
    setIsOpen(true);
  };

  const getExamTypeLabel = (type: string) => {
    return examTypes.find(t => t.value === type)?.label || type;
  };

  // Stats
  const stats = {
    total: exams?.length || 0,
    upcoming: exams?.filter(e => e.status === 'upcoming').length || 0,
    ongoing: exams?.filter(e => e.status === 'ongoing').length || 0,
    completed: exams?.filter(e => e.status === 'completed').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">পরীক্ষা ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              পরীক্ষার সময়সূচী তৈরি ও পরিচালনা করুন
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) { setEditingExam(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-bangla">নতুন পরীক্ষা</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingExam ? 'পরীক্ষা সম্পাদনা' : 'নতুন পরীক্ষা যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">পরীক্ষার নাম (ইংরেজি)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">পরীক্ষার নাম (বাংলা)</Label>
                    <Input
                      value={formData.name_bn}
                      onChange={(e) => setFormData({...formData, name_bn: e.target.value})}
                      className="font-bangla"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">পরীক্ষার ধরন</Label>
                    <Select value={formData.exam_type} onValueChange={(v) => setFormData({...formData, exam_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {examTypes.map(type => (
                          <SelectItem key={type.value} value={type.value} className="font-bangla">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">ক্লাস</Label>
                    <Select value={formData.class} onValueChange={(v) => setFormData({...formData, class: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="ক্লাস নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c} value={c} className="font-bangla">
                            {c} শ্রেণী
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">শুরুর তারিখ</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">শেষের তারিখ</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">শিক্ষাবর্ষ</Label>
                    <Input
                      value={formData.academic_year}
                      onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">অবস্থা</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming" className="font-bangla">আসন্ন</SelectItem>
                        <SelectItem value="ongoing" className="font-bangla">চলমান</SelectItem>
                        <SelectItem value="completed" className="font-bangla">সম্পন্ন</SelectItem>
                        <SelectItem value="cancelled" className="font-bangla">বাতিল</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    <span className="font-bangla">বাতিল</span>
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    <span className="font-bangla">{editingExam ? 'আপডেট' : 'যোগ করুন'}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট পরীক্ষা</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">আসন্ন</p>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">চলমান</p>
                  <p className="text-2xl font-bold">{stats.ongoing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">সম্পন্ন</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="পরীক্ষা খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-bangla"
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ক্লাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব ক্লাস</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c} value={c} className="font-bangla">{c} শ্রেণী</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="অবস্থা" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব অবস্থা</SelectItem>
                  <SelectItem value="upcoming" className="font-bangla">আসন্ন</SelectItem>
                  <SelectItem value="ongoing" className="font-bangla">চলমান</SelectItem>
                  <SelectItem value="completed" className="font-bangla">সম্পন্ন</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">পরীক্ষা তালিকা</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : exams?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো পরীক্ষা পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">পরীক্ষার নাম</TableHead>
                      <TableHead className="font-bangla">ধরন</TableHead>
                      <TableHead className="font-bangla">ক্লাস</TableHead>
                      <TableHead className="font-bangla">তারিখ</TableHead>
                      <TableHead className="font-bangla">অবস্থা</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams?.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium font-bangla">{exam.name_bn || exam.name}</p>
                            <p className="text-sm text-muted-foreground">{exam.academic_year}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bangla">
                            {getExamTypeLabel(exam.exam_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bangla">{exam.class} শ্রেণী</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(exam.start_date), 'dd MMM', { locale: bn })}
                              {exam.end_date && ` - ${format(new Date(exam.end_date), 'dd MMM', { locale: bn })}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[exam.status]}>
                            {statusLabels[exam.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                if (confirm('আপনি কি এই পরীক্ষা মুছে ফেলতে চান?')) {
                                  deleteMutation.mutate(exam.id);
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