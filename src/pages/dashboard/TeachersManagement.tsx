import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Users, UserPlus, Key, Copy, Mail, Search, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Teacher {
  id: string;
  full_name: string;
  full_name_bn: string | null;
  employee_id: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  gender: string | null;
  status: string;
  user_id: string | null;
  school_id: string | null;
}

interface GeneratedCredentials {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

export default function TeachersManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [credentials, setCredentials] = useState<GeneratedCredentials | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    full_name_bn: '',
    employee_id: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    gender: '',
    create_account: true,
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

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers', userSchool?.school_id],
    queryFn: async () => {
      let query = supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userSchool?.school_id) {
        query = query.eq('school_id', userSchool.school_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Teacher[];
    },
    enabled: !!userSchool?.school_id,
  });

  // Create teacher mutation
  const createTeacher = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('teachers')
        .insert([{
          full_name: data.full_name,
          full_name_bn: data.full_name_bn || null,
          employee_id: data.employee_id,
          email: data.email || null,
          phone: data.phone || null,
          department: data.department || null,
          designation: data.designation || null,
          gender: data.gender || null,
          school_id: userSchool?.school_id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: async (teacher) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      
      // Auto-create account if requested
      if (formData.create_account && formData.email && userSchool?.school_id) {
        await createUserAccount(teacher);
      } else {
        toast.success('শিক্ষক সফলভাবে যুক্ত হয়েছে');
        resetForm();
        setIsDialogOpen(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'শিক্ষক যুক্ত করতে সমস্যা হয়েছে');
    },
  });

  // Create user account for teacher
  const createUserAccount = async (teacher: Teacher) => {
    if (!teacher.email || !userSchool?.school_id) return;
    
    setCreatingAccount(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-user-account', {
        body: {
          entity_type: 'teacher',
          entity_id: teacher.id,
          school_id: userSchool.school_id,
          email: teacher.email,
          full_name: teacher.full_name,
          phone: teacher.phone,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে');
      }

      if (response.data?.credentials) {
        setCredentials(response.data.credentials);
        setIsCredentialDialogOpen(true);
        toast.success('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে');
      }

      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Update teacher mutation
  const updateTeacher = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Teacher> }) => {
      const { error } = await supabase
        .from('teachers')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('শিক্ষক আপডেট হয়েছে');
      resetForm();
      setIsDialogOpen(false);
      setEditingTeacher(null);
    },
  });

  // Delete teacher mutation
  const deleteTeacher = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('শিক্ষক মুছে ফেলা হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      full_name_bn: '',
      employee_id: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      gender: '',
      create_account: true,
    });
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      full_name_bn: teacher.full_name_bn || '',
      employee_id: teacher.employee_id,
      email: teacher.email || '',
      phone: teacher.phone || '',
      department: teacher.department || '',
      designation: teacher.designation || '',
      gender: teacher.gender || '',
      create_account: false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateTeacher.mutate({ 
        id: editingTeacher.id, 
        data: {
          full_name: formData.full_name,
          full_name_bn: formData.full_name_bn || null,
          employee_id: formData.employee_id,
          email: formData.email || null,
          phone: formData.phone || null,
          department: formData.department || null,
          designation: formData.designation || null,
          gender: formData.gender || null,
        }
      });
    } else {
      createTeacher.mutate(formData);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি করা হয়েছে');
  };

  const filteredTeachers = teachers?.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.full_name_bn?.includes(searchTerm)
  );

  const stats = {
    total: teachers?.length || 0,
    active: teachers?.filter(t => t.status === 'active').length || 0,
    withAccount: teachers?.filter(t => t.user_id).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">শিক্ষক ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground font-bangla">শিক্ষক তথ্য ও অ্যাকাউন্ট পরিচালনা</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTeacher(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="font-bangla">
                <Plus className="w-4 h-4 mr-2" />
                নতুন শিক্ষক
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingTeacher ? 'শিক্ষক সম্পাদনা' : 'নতুন শিক্ষক যুক্ত করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">নাম (English)</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">নাম (বাংলা)</Label>
                    <Input
                      value={formData.full_name_bn}
                      onChange={(e) => setFormData({ ...formData, full_name_bn: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">কর্মচারী আইডি</Label>
                    <Input
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">ইমেইল</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">ফোন</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">লিঙ্গ</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">পুরুষ</SelectItem>
                        <SelectItem value="female">মহিলা</SelectItem>
                        <SelectItem value="other">অন্যান্য</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">বিভাগ</Label>
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="যেমন: বাংলা, গণিত"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">পদবী</Label>
                    <Input
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="যেমন: সহকারী শিক্ষক"
                    />
                  </div>
                </div>
                
                {!editingTeacher && formData.email && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <input
                      type="checkbox"
                      id="create_account"
                      checked={formData.create_account}
                      onChange={(e) => setFormData({ ...formData, create_account: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="create_account" className="text-sm font-bangla">
                      স্বয়ংক্রিয়ভাবে লগইন অ্যাকাউন্ট তৈরি করুন
                    </label>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" disabled={createTeacher.isPending || creatingAccount}>
                    <span className="font-bangla">
                      {creatingAccount ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : editingTeacher ? 'আপডেট করুন' : 'যুক্ত করুন'}
                    </span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষক</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <UserPlus className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground font-bangla">সক্রিয়</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Key className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withAccount}</p>
                  <p className="text-sm text-muted-foreground font-bangla">অ্যাকাউন্টসহ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="শিক্ষক খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-bangla"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla">নাম</TableHead>
                  <TableHead className="font-bangla">আইডি</TableHead>
                  <TableHead className="font-bangla">বিভাগ</TableHead>
                  <TableHead className="font-bangla">যোগাযোগ</TableHead>
                  <TableHead className="font-bangla">অ্যাকাউন্ট</TableHead>
                  <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <span className="font-bangla">লোড হচ্ছে...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredTeachers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <span className="font-bangla">কোনো শিক্ষক পাওয়া যায়নি</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers?.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{teacher.full_name}</p>
                          {teacher.full_name_bn && (
                            <p className="text-sm text-muted-foreground font-bangla">{teacher.full_name_bn}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{teacher.employee_id}</code>
                      </TableCell>
                      <TableCell>
                        <span className="font-bangla">{teacher.department || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {teacher.email && <p>{teacher.email}</p>}
                          {teacher.phone && <p className="text-muted-foreground">{teacher.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {teacher.user_id ? (
                          <Badge variant="default" className="bg-green-500 font-bangla">সক্রিয়</Badge>
                        ) : teacher.email ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createUserAccount(teacher)}
                            disabled={creatingAccount}
                          >
                            <Key className="w-3 h-3 mr-1" />
                            <span className="font-bangla">তৈরি করুন</span>
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="font-bangla">ইমেইল নেই</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(teacher)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('আপনি কি নিশ্চিত?')) {
                                deleteTeacher.mutate(teacher.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-bangla">লগইন তথ্য তৈরি হয়েছে</DialogTitle>
            </DialogHeader>
            {credentials && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">নাম</p>
                      <p className="font-medium">{credentials.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">ইমেইল</p>
                      <p className="font-medium">{credentials.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">পাসওয়ার্ড</p>
                      <p className="font-mono text-lg">{credentials.password}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-bangla">
                  এই তথ্যগুলো নিরাপদে সংরক্ষণ করুন। প্রথম লগইনের পর পাসওয়ার্ড পরিবর্তন করতে বলুন।
                </p>
              </div>
            )}
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
