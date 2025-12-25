import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Download, Filter, Users, Eye } from 'lucide-react';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const sections = ['ক', 'খ', 'গ', 'ঘ'];

export default function StudentsManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    roll_number: '',
    full_name: '',
    full_name_bn: '',
    class: '',
    section: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', searchTerm, selectedClass],
    queryFn: async () => {
      let query = supabase.from('students').select('*').order('roll_number');
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,full_name_bn.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
      }
      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('students').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'সফল!', description: 'শিক্ষার্থী যোগ করা হয়েছে' });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('students').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'সফল!', description: 'শিক্ষার্থীর তথ্য আপডেট হয়েছে' });
      setIsOpen(false);
      setEditingStudent(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'সফল!', description: 'শিক্ষার্থী মুছে ফেলা হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      roll_number: '', full_name: '', full_name_bn: '', class: '', section: '',
      date_of_birth: '', gender: '', phone: '', email: '', address: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      roll_number: student.roll_number || '',
      full_name: student.full_name || '',
      full_name_bn: student.full_name_bn || '',
      class: student.class || '',
      section: student.section || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
    });
    setIsOpen(true);
  };

  const exportToCSV = () => {
    if (!students?.length) return;
    const headers = ['রোল নম্বর', 'নাম', 'ক্লাস', 'সেকশন', 'ফোন', 'ইমেইল'];
    const rows = students.map(s => [s.roll_number, s.full_name_bn || s.full_name, s.class, s.section, s.phone, s.email]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">শিক্ষার্থী ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">সকল শিক্ষার্থীদের তথ্য পরিচালনা করুন</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportToCSV} className="font-bangla">
              <Download className="w-4 h-4 mr-2" /> এক্সপোর্ট
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setEditingStudent(null); resetForm(); } }}>
              <DialogTrigger asChild>
                <Button className="btn-accent font-bangla">
                  <Plus className="w-4 h-4 mr-2" /> নতুন শিক্ষার্থী
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-bangla">{editingStudent ? 'শিক্ষার্থীর তথ্য সম্পাদনা' : 'নতুন শিক্ষার্থী যোগ করুন'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="font-bangla">রোল নম্বর *</Label><Input value={formData.roll_number} onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} required /></div>
                    <div><Label className="font-bangla">নাম (ইংরেজি) *</Label><Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required /></div>
                    <div><Label className="font-bangla">নাম (বাংলা)</Label><Input value={formData.full_name_bn} onChange={(e) => setFormData({ ...formData, full_name_bn: e.target.value })} className="font-bangla" /></div>
                    <div><Label className="font-bangla">ক্লাস *</Label><Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}><SelectTrigger><SelectValue placeholder="ক্লাস নির্বাচন" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c} শ্রেণী</SelectItem>)}</SelectContent></Select></div>
                    <div><Label className="font-bangla">সেকশন</Label><Select value={formData.section} onValueChange={(v) => setFormData({ ...formData, section: v })}><SelectTrigger><SelectValue placeholder="সেকশন নির্বাচন" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label className="font-bangla">জন্ম তারিখ</Label><Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} /></div>
                    <div><Label className="font-bangla">লিঙ্গ</Label><Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}><SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger><SelectContent><SelectItem value="male">পুরুষ</SelectItem><SelectItem value="female">মহিলা</SelectItem></SelectContent></Select></div>
                    <div><Label className="font-bangla">ফোন</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                    <div><Label className="font-bangla">ইমেইল</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                    <div className="col-span-2"><Label className="font-bangla">ঠিকানা</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="font-bangla" /></div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="font-bangla">বাতিল</Button>
                    <Button type="submit" className="btn-accent font-bangla" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingStudent ? 'আপডেট করুন' : 'যোগ করুন'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="নাম বা রোল দিয়ে খুঁজুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 font-bangla" />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="ক্লাস ফিল্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ক্লাস</SelectItem>
                  {classes.map(c => <SelectItem key={c} value={c}>{c} শ্রেণী</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><Users className="w-8 h-8 mx-auto text-primary mb-2" /><p className="text-2xl font-bold">{students?.length || 0}</p><p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষার্থী</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{students?.filter(s => s.gender === 'male').length || 0}</p><p className="text-sm text-muted-foreground font-bangla">ছাত্র</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{students?.filter(s => s.gender === 'female').length || 0}</p><p className="text-sm text-muted-foreground font-bangla">ছাত্রী</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{students?.filter(s => s.status === 'active').length || 0}</p><p className="text-sm text-muted-foreground font-bangla">সক্রিয়</p></CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla">রোল</TableHead>
                  <TableHead className="font-bangla">নাম</TableHead>
                  <TableHead className="font-bangla">ক্লাস</TableHead>
                  <TableHead className="font-bangla">সেকশন</TableHead>
                  <TableHead className="font-bangla">ফোন</TableHead>
                  <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                  <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 font-bangla">লোড হচ্ছে...</TableCell></TableRow>
                ) : students?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 font-bangla">কোনো শিক্ষার্থী পাওয়া যায়নি</TableCell></TableRow>
                ) : (
                  students?.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.roll_number}</TableCell>
                      <TableCell className="font-bangla">{student.full_name_bn || student.full_name}</TableCell>
                      <TableCell className="font-bangla">{student.class} শ্রেণী</TableCell>
                      <TableCell>{student.section || '-'}</TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                      <TableCell><Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="font-bangla">{student.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(student.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
