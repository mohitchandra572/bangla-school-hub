import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Users, UserPlus, Key, Copy, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TeacherForm, { TeacherFormData, initialTeacherFormData } from '@/components/forms/TeacherForm';

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

interface SubscriptionLimit {
  allowed: boolean;
  current: number;
  max: number;
  features: Record<string, boolean>;
  plan: string;
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
  const [formData, setFormData] = useState<TeacherFormData>(initialTeacherFormData);

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
    queryKey: ['subscription-limit-teacher', userSchool?.school_id],
    queryFn: async () => {
      if (!userSchool?.school_id) return null;
      const { data, error } = await supabase
        .rpc('check_school_limit', { 
          _school_id: userSchool.school_id, 
          _entity_type: 'teacher' 
        });
      
      if (error) return null;
      return data as unknown as SubscriptionLimit;
    },
    enabled: !!userSchool?.school_id,
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
    mutationFn: async (data: TeacherFormData) => {
      const { data: result, error } = await supabase
        .from('teachers')
        .insert([{
          employee_id: data.employee_id,
          full_name: data.full_name,
          full_name_bn: data.full_name_bn || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
          blood_group: data.blood_group || null,
          religion: data.religion || null,
          nationality: data.nationality || null,
          national_id: data.national_id || null,
          designation: data.designation || null,
          department: data.department || null,
          subjects_taught: data.subjects_taught.length > 0 ? data.subjects_taught : null,
          assigned_classes: data.assigned_classes.length > 0 ? data.assigned_classes : null,
          assigned_sections: data.assigned_sections.length > 0 ? data.assigned_sections : null,
          education_details: data.education_details,
          training_details: data.training_details,
          experience_years: data.experience_years || 0,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          emergency_contact: data.emergency_contact || null,
          emergency_contact_relation: data.emergency_contact_relation || null,
          joining_date: data.joining_date || null,
          employment_type: data.employment_type || 'permanent',
          salary_grade: data.salary_grade || null,
          bank_account: data.bank_account || null,
          bank_name: data.bank_name || null,
          school_id: userSchool?.school_id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: async (teacher) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limit-teacher'] });
      
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
  const createUserAccount = async (teacher: any) => {
    if (!teacher.email || !userSchool?.school_id) return;
    
    setCreatingAccount(true);
    try {
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeacherFormData> }) => {
      const { error } = await supabase
        .from('teachers')
        .update({
          employee_id: data.employee_id,
          full_name: data.full_name,
          full_name_bn: data.full_name_bn || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
          blood_group: data.blood_group || null,
          religion: data.religion || null,
          nationality: data.nationality || null,
          national_id: data.national_id || null,
          designation: data.designation || null,
          department: data.department || null,
          subjects_taught: data.subjects_taught && data.subjects_taught.length > 0 ? data.subjects_taught : null,
          assigned_classes: data.assigned_classes && data.assigned_classes.length > 0 ? data.assigned_classes : null,
          assigned_sections: data.assigned_sections && data.assigned_sections.length > 0 ? data.assigned_sections : null,
          education_details: data.education_details,
          training_details: data.training_details,
          experience_years: data.experience_years || 0,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          emergency_contact: data.emergency_contact || null,
          emergency_contact_relation: data.emergency_contact_relation || null,
          joining_date: data.joining_date || null,
          employment_type: data.employment_type || 'permanent',
          salary_grade: data.salary_grade || null,
          bank_account: data.bank_account || null,
          bank_name: data.bank_name || null,
        })
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
      queryClient.invalidateQueries({ queryKey: ['subscription-limit-teacher'] });
      toast.success('শিক্ষক মুছে ফেলা হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData(initialTeacherFormData);
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      ...initialTeacherFormData,
      employee_id: teacher.employee_id || '',
      full_name: teacher.full_name || '',
      full_name_bn: teacher.full_name_bn || '',
      date_of_birth: teacher.date_of_birth || '',
      gender: teacher.gender || '',
      blood_group: teacher.blood_group || '',
      religion: teacher.religion || '',
      nationality: teacher.nationality || 'বাংলাদেশী',
      national_id: teacher.national_id || '',
      designation: teacher.designation || '',
      department: teacher.department || '',
      subjects_taught: teacher.subjects_taught || [],
      assigned_classes: teacher.assigned_classes || [],
      assigned_sections: teacher.assigned_sections || [],
      education_details: teacher.education_details || [{ degree: '', institution: '', year: '' }],
      training_details: teacher.training_details || [],
      experience_years: teacher.experience_years || 0,
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      emergency_contact: teacher.emergency_contact || '',
      emergency_contact_relation: teacher.emergency_contact_relation || '',
      joining_date: teacher.joining_date || '',
      employment_type: teacher.employment_type || 'permanent',
      salary_grade: teacher.salary_grade || '',
      bank_account: teacher.bank_account || '',
      bank_name: teacher.bank_name || '',
      create_account: false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check subscription limit before creating
    if (!editingTeacher && subscriptionLimit && !subscriptionLimit.allowed) {
      toast.error(`সাবস্ক্রিপশন লিমিট অতিক্রম করেছে। বর্তমান: ${subscriptionLimit.current}/${subscriptionLimit.max}`);
      return;
    }
    
    if (editingTeacher) {
      updateTeacher.mutate({ id: editingTeacher.id, data: formData });
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
                    আপনার প্ল্যানে সর্বোচ্চ {subscriptionLimit?.max} জন শিক্ষক যুক্ত করা যায়। 
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
                  সতর্কতা: আপনার শিক্ষক লিমিট প্রায় শেষ ({subscriptionLimit?.current}/{subscriptionLimit?.max})
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">শিক্ষক ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground font-bangla">
              শিক্ষক তথ্য ও অ্যাকাউন্ট পরিচালনা
              {subscriptionLimit && subscriptionLimit.max > 0 && (
                <span className="ml-2">
                  ({subscriptionLimit.current}/{subscriptionLimit.max})
                </span>
              )}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTeacher(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="font-bangla" disabled={limitReached}>
                <Plus className="w-4 h-4 mr-2" />
                নতুন শিক্ষক
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingTeacher ? 'শিক্ষক সম্পাদনা' : 'নতুন শিক্ষক যুক্ত করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <TeacherForm 
                  formData={formData} 
                  onChange={setFormData} 
                  isEditing={!!editingTeacher} 
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="font-bangla">
                    বাতিল
                  </Button>
                  <Button type="submit" disabled={createTeacher.isPending || creatingAccount} className="font-bangla">
                    {creatingAccount ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : editingTeacher ? 'আপডেট করুন' : 'যুক্ত করুন'}
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
              className="pl-10 font-bangla"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla">কর্মচারী আইডি</TableHead>
                  <TableHead className="font-bangla">নাম</TableHead>
                  <TableHead className="font-bangla">বিভাগ</TableHead>
                  <TableHead className="font-bangla">পদবী</TableHead>
                  <TableHead className="font-bangla">ফোন</TableHead>
                  <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                  <TableHead className="font-bangla">অ্যাকাউন্ট</TableHead>
                  <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center font-bangla">লোড হচ্ছে...</TableCell>
                  </TableRow>
                ) : filteredTeachers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center font-bangla">কোনো শিক্ষক পাওয়া যায়নি</TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers?.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-mono text-sm">{teacher.employee_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{teacher.full_name}</p>
                          {teacher.full_name_bn && (
                            <p className="text-sm text-muted-foreground font-bangla">{teacher.full_name_bn}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bangla">{teacher.department || '-'}</TableCell>
                      <TableCell className="font-bangla">{teacher.designation || '-'}</TableCell>
                      <TableCell>{teacher.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'} className="font-bangla">
                          {teacher.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.user_id ? 'default' : 'outline'} className="font-bangla">
                          {teacher.user_id ? 'আছে' : 'নেই'}
                        </Badge>
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
                              if (confirm('আপনি কি নিশ্চিত যে আপনি এই শিক্ষককে মুছে ফেলতে চান?')) {
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-bangla">লগইন তথ্য</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-bangla">
                নিচের তথ্য শিক্ষককে প্রদান করুন। এই তথ্য একবার দেখানো হবে।
              </p>
              {credentials && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">ইমেইল</p>
                      <p className="font-mono">{credentials.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(credentials.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">পাসওয়ার্ড</p>
                      <p className="font-mono">{credentials.password}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(credentials.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCredentialDialogOpen(false)} className="font-bangla">বন্ধ করুন</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
