import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Download, Filter, Users, Key, Copy, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const sections = ['ক', 'খ', 'গ', 'ঘ'];

interface GeneratedCredentials {
  email: string;
  password: string;
  full_name: string;
}

interface SubscriptionLimit {
  allowed: boolean;
  current: number;
  max: number;
  features: Record<string, boolean>;
  plan: string;
}

export default function StudentsManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [credentials, setCredentials] = useState<{
    student?: GeneratedCredentials;
    parent?: GeneratedCredentials;
  } | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

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
    // Parent info
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    create_accounts: true,
  });

  // Get user's school
  const { data: userSchool } = useQuery({
    queryKey: ['user-school', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('school_users')
        .select('school_id, schools(*)')
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check subscription limits
  const { data: subscriptionLimit } = useQuery({
    queryKey: ['subscription-limit', userSchool?.school_id],
    queryFn: async () => {
      if (!userSchool?.school_id) return null;
      const { data, error } = await supabase
        .rpc('check_school_limit', { 
          _school_id: userSchool.school_id, 
          _entity_type: 'student' 
        });
      
      if (error) return null;
      return data as unknown as SubscriptionLimit;
    },
    enabled: !!userSchool?.school_id,
  });

  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', searchTerm, selectedClass, userSchool?.school_id],
    queryFn: async () => {
      let query = supabase.from('students').select('*').order('roll_number');
      
      if (userSchool?.school_id) {
        query = query.eq('school_id', userSchool.school_id);
      }
      
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

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase.from('students').insert([{
        roll_number: data.roll_number,
        full_name: data.full_name,
        full_name_bn: data.full_name_bn || null,
        class: data.class,
        section: data.section || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        school_id: userSchool?.school_id,
      }]).select().single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: async (student) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limit'] });
      
      // Auto-create accounts if requested
      if (formData.create_accounts && formData.email && userSchool?.school_id) {
        await createUserAccounts(student);
      } else {
        toast.success('শিক্ষার্থী সফলভাবে যুক্ত হয়েছে');
        resetForm();
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'শিক্ষার্থী যুক্ত করতে সমস্যা হয়েছে');
    },
  });

  // Create user accounts for student and parent
  const createUserAccounts = async (student: any) => {
    if (!userSchool?.school_id) return;
    
    setCreatingAccount(true);
    try {
      const response = await supabase.functions.invoke('create-user-account', {
        body: {
          entity_type: 'student',
          entity_id: student.id,
          school_id: userSchool.school_id,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          parent_email: formData.parent_email || undefined,
          parent_name: formData.parent_name || undefined,
          parent_phone: formData.parent_phone || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে');
      }

      const creds: { student?: GeneratedCredentials; parent?: GeneratedCredentials } = {};
      
      if (response.data?.credentials) {
        creds.student = response.data.credentials;
      }
      if (response.data?.parent_credentials) {
        creds.parent = response.data.parent_credentials;
      }

      if (Object.keys(creds).length > 0) {
        setCredentials(creds);
        setIsCredentialDialogOpen(true);
      }

      toast.success('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error creating accounts:', error);
      toast.error(error.message || 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('students').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('শিক্ষার্থীর তথ্য আপডেট হয়েছে');
      setIsOpen(false);
      setEditingStudent(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limit'] });
      toast.success('শিক্ষার্থী মুছে ফেলা হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData({
      roll_number: '', full_name: '', full_name_bn: '', class: '', section: '',
      date_of_birth: '', gender: '', phone: '', email: '', address: '',
      parent_name: '', parent_email: '', parent_phone: '', create_accounts: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check subscription limit before creating
    if (!editingStudent && subscriptionLimit && !subscriptionLimit.allowed) {
      toast.error(`সাবস্ক্রিপশন লিমিট অতিক্রম করেছে। বর্তমান: ${subscriptionLimit.current}/${subscriptionLimit.max}`);
      return;
    }
    
    if (editingStudent) {
      updateMutation.mutate({ 
        id: editingStudent.id, 
        data: {
          roll_number: formData.roll_number,
          full_name: formData.full_name,
          full_name_bn: formData.full_name_bn || null,
          class: formData.class,
          section: formData.section || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
        }
      });
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
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      create_accounts: false,
    });
    setIsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি করা হয়েছে');
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

  const limitReached = subscriptionLimit && !subscriptionLimit.allowed;
  const limitWarning = subscriptionLimit && subscriptionLimit.max > 0 && 
    (subscriptionLimit.current / subscriptionLimit.max) >= 0.9;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Subscription Limit Warning */}
        {limitReached && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-800 font-bangla">সাবস্ক্রিপশন লিমিট অতিক্রম!</p>
                  <p className="text-sm text-red-600 font-bangla">
                    আপনার প্ল্যানে সর্বোচ্চ {subscriptionLimit?.max} জন শিক্ষার্থী যুক্ত করা যায়। 
                    আপগ্রেড করতে সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {limitWarning && !limitReached && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <p className="text-sm text-amber-800 font-bangla">
                  সতর্কতা: আপনার শিক্ষার্থী লিমিট প্রায় শেষ ({subscriptionLimit?.current}/{subscriptionLimit?.max})
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">শিক্ষার্থী ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">
              সকল শিক্ষার্থীদের তথ্য পরিচালনা করুন
              {subscriptionLimit && subscriptionLimit.max > 0 && (
                <span className="ml-2">
                  ({subscriptionLimit.current}/{subscriptionLimit.max})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportToCSV} className="font-bangla">
              <Download className="w-4 h-4 mr-2" /> এক্সপোর্ট
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => { 
              setIsOpen(open); 
              if (!open) { setEditingStudent(null); resetForm(); } 
            }}>
              <DialogTrigger asChild>
                <Button className="btn-accent font-bangla" disabled={limitReached}>
                  <Plus className="w-4 h-4 mr-2" /> নতুন শিক্ষার্থী
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-bangla">
                    {editingStudent ? 'শিক্ষার্থীর তথ্য সম্পাদনা' : 'নতুন শিক্ষার্থী যোগ করুন'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Student Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold font-bangla border-b pb-2">শিক্ষার্থীর তথ্য</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-bangla">রোল নম্বর *</Label>
                        <Input 
                          value={formData.roll_number} 
                          onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">নাম (ইংরেজি) *</Label>
                        <Input 
                          value={formData.full_name} 
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">নাম (বাংলা)</Label>
                        <Input 
                          value={formData.full_name_bn} 
                          onChange={(e) => setFormData({ ...formData, full_name_bn: e.target.value })} 
                          className="font-bangla" 
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">ক্লাস *</Label>
                        <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                          <SelectTrigger><SelectValue placeholder="ক্লাস নির্বাচন" /></SelectTrigger>
                          <SelectContent>
                            {classes.map(c => <SelectItem key={c} value={c}>{c} শ্রেণী</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-bangla">সেকশন</Label>
                        <Select value={formData.section} onValueChange={(v) => setFormData({ ...formData, section: v })}>
                          <SelectTrigger><SelectValue placeholder="সেকশন নির্বাচন" /></SelectTrigger>
                          <SelectContent>
                            {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-bangla">জন্ম তারিখ</Label>
                        <Input 
                          type="date" 
                          value={formData.date_of_birth} 
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">লিঙ্গ</Label>
                        <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                          <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">পুরুষ</SelectItem>
                            <SelectItem value="female">মহিলা</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-bangla">ফোন</Label>
                        <Input 
                          value={formData.phone} 
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">ইমেইল (শিক্ষার্থীর)</Label>
                        <Input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="font-bangla">ঠিকানা</Label>
                        <Input 
                          value={formData.address} 
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                          className="font-bangla" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent Info - Only for new students */}
                  {!editingStudent && (
                    <div className="space-y-4">
                      <h3 className="font-semibold font-bangla border-b pb-2">অভিভাবকের তথ্য</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-bangla">অভিভাবকের নাম</Label>
                          <Input 
                            value={formData.parent_name} 
                            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Label className="font-bangla">অভিভাবকের ইমেইল</Label>
                          <Input 
                            type="email" 
                            value={formData.parent_email} 
                            onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Label className="font-bangla">অভিভাবকের ফোন</Label>
                          <Input 
                            value={formData.parent_phone} 
                            onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-create accounts checkbox */}
                  {!editingStudent && (formData.email || formData.parent_email) && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <input
                        type="checkbox"
                        id="create_accounts"
                        checked={formData.create_accounts}
                        onChange={(e) => setFormData({ ...formData, create_accounts: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="create_accounts" className="text-sm font-bangla">
                        স্বয়ংক্রিয়ভাবে লগইন অ্যাকাউন্ট তৈরি করুন (শিক্ষার্থী ও অভিভাবক)
                      </label>
                    </div>
                  )}

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsOpen(false)} 
                      className="font-bangla"
                    >
                      বাতিল
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-accent font-bangla" 
                      disabled={createMutation.isPending || updateMutation.isPending || creatingAccount}
                    >
                      {creatingAccount ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : editingStudent ? 'আপডেট করুন' : 'যোগ করুন'}
                    </Button>
                  </DialogFooter>
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
                <Input 
                  placeholder="নাম বা রোল দিয়ে খুঁজুন..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 font-bangla" 
                />
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
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{students?.length || 0}</p>
              <p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষার্থী</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{students?.filter(s => s.gender === 'male').length || 0}</p>
              <p className="text-sm text-muted-foreground font-bangla">ছাত্র</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{students?.filter(s => s.gender === 'female').length || 0}</p>
              <p className="text-sm text-muted-foreground font-bangla">ছাত্রী</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Key className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{students?.filter(s => s.user_id).length || 0}</p>
              <p className="text-sm text-muted-foreground font-bangla">অ্যাকাউন্টসহ</p>
            </CardContent>
          </Card>
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
                  <TableHead className="font-bangla">অ্যাকাউন্ট</TableHead>
                  <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 font-bangla">লোড হচ্ছে...</TableCell>
                  </TableRow>
                ) : students?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 font-bangla">কোনো শিক্ষার্থী পাওয়া যায়নি</TableCell>
                  </TableRow>
                ) : (
                  students?.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.roll_number}</TableCell>
                      <TableCell className="font-bangla">{student.full_name_bn || student.full_name}</TableCell>
                      <TableCell className="font-bangla">{student.class} শ্রেণী</TableCell>
                      <TableCell>{student.section || '-'}</TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                      <TableCell>
                        {student.user_id ? (
                          <Badge variant="default" className="bg-green-500 font-bangla">সক্রিয়</Badge>
                        ) : (
                          <Badge variant="secondary" className="font-bangla">নেই</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive" 
                          onClick={() => {
                            if (confirm('আপনি কি নিশ্চিত?')) {
                              deleteMutation.mutate(student.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Credentials Dialog */}
        <Dialog open={isCredentialDialogOpen} onOpenChange={setIsCredentialDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-bangla">লগইন তথ্য তৈরি হয়েছে</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {credentials?.student && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <h4 className="font-semibold font-bangla text-blue-800">শিক্ষার্থীর লগইন তথ্য</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">ইমেইল</p>
                      <p className="font-medium">{credentials.student.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.student!.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">পাসওয়ার্ড</p>
                      <p className="font-mono text-lg">{credentials.student.password}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.student!.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {credentials?.parent && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <h4 className="font-semibold font-bangla text-green-800">অভিভাবকের লগইন তথ্য</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">নাম</p>
                      <p className="font-medium">{credentials.parent.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">ইমেইল</p>
                      <p className="font-medium">{credentials.parent.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.parent!.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">পাসওয়ার্ড</p>
                      <p className="font-mono text-lg">{credentials.parent.password}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.parent!.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground font-bangla">
                এই তথ্যগুলো নিরাপদে সংরক্ষণ করুন। প্রথম লগইনের পর পাসওয়ার্ড পরিবর্তন করতে বলুন।
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCredentialDialogOpen(false)}>
                <span className="font-bangla">বন্ধ করুন</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
