import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Building2, Users, GraduationCap, PlayCircle, PauseCircle, Search, Copy, Key } from 'lucide-react';

type SubscriptionPlan = 'basic' | 'standard' | 'premium' | 'enterprise';

interface School {
  id: string;
  name: string;
  name_bn: string | null;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  subscription_plan: SubscriptionPlan;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
}

interface SchoolStats {
  total_students: number;
  total_teachers: number;
}

interface GeneratedCredentials {
  email: string;
  password: string;
  schoolName: string;
}

const planColors: Record<SubscriptionPlan, string> = {
  basic: 'bg-gray-100 text-gray-800',
  standard: 'bg-blue-100 text-blue-800',
  premium: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

const planNames: Record<SubscriptionPlan, string> = {
  basic: 'বেসিক',
  standard: 'স্ট্যান্ডার্ড',
  premium: 'প্রিমিয়াম',
  enterprise: 'এন্টারপ্রাইজ',
};

export default function SchoolsManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createAdminAccount, setCreateAdminAccount] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    subscription_plan: 'basic' as SubscriptionPlan,
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  // Fetch schools
  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as School[];
    },
  });

  // Fetch subscription plans
  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Create school mutation
  const createSchool = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First create the school
      const { data: result, error } = await supabase
        .from('schools')
        .insert([{
          name: data.name,
          name_bn: data.name_bn,
          code: data.code,
          address: data.address,
          phone: data.phone,
          email: data.email,
          subscription_plan: data.subscription_plan,
        }])
        .select()
        .single();
      
      if (error) throw error;

      // If creating admin account, call the setup-admin edge function
      if (createAdminAccount && data.admin_email && data.admin_password) {
        const { data: adminResult, error: adminError } = await supabase.functions.invoke('setup-admin', {
          body: {
            email: data.admin_email,
            password: data.admin_password,
            full_name: data.admin_name || data.name + ' Admin',
            role: 'school_admin',
            school_name: data.name,
            school_code: data.code,
          },
        });

        if (adminError) {
          console.error('Admin creation error:', adminError);
          // Still return the school, but notify about admin error
          return { school: result, adminError: adminError.message };
        }

        // Link existing school to the new admin
        if (adminResult?.user_id) {
          await supabase.from('school_users').insert({
            school_id: result.id,
            user_id: adminResult.user_id,
            is_admin: true,
          });
        }

        return { 
          school: result, 
          credentials: {
            email: data.admin_email,
            password: data.admin_password,
            schoolName: data.name,
          }
        };
      }
      
      return { school: result };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      
      if (result.credentials) {
        setGeneratedCredentials(result.credentials);
        setShowCredentials(true);
        toast.success('স্কুল ও অ্যাডমিন একাউন্ট সফলভাবে তৈরি হয়েছে');
      } else {
        toast.success('স্কুল সফলভাবে তৈরি হয়েছে');
      }
      
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'স্কুল তৈরিতে সমস্যা হয়েছে');
    },
  });

  // Update school mutation
  const updateSchool = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<School> }) => {
      const { error } = await supabase
        .from('schools')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('স্কুল আপডেট হয়েছে');
      resetForm();
      setIsDialogOpen(false);
      setEditingSchool(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'আপডেটে সমস্যা হয়েছে');
    },
  });

  // Toggle school status mutation
  const toggleSchoolStatus = useMutation({
    mutationFn: async ({ id, is_suspended, suspension_reason }: { id: string; is_suspended: boolean; suspension_reason?: string }) => {
      const { error } = await supabase
        .from('schools')
        .update({ 
          is_suspended, 
          suspension_reason: is_suspended ? suspension_reason : null 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('স্কুল স্ট্যাটাস আপডেট হয়েছে');
    },
  });

  // Delete school mutation
  const deleteSchool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('স্কুল মুছে ফেলা হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_bn: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      subscription_plan: 'basic',
      admin_name: '',
      admin_email: '',
      admin_password: '',
    });
    setCreateAdminAccount(true);
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      name_bn: school.name_bn || '',
      code: school.code,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      subscription_plan: school.subscription_plan,
      admin_name: '',
      admin_email: '',
      admin_password: '',
    });
    setCreateAdminAccount(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchool) {
      updateSchool.mutate({ id: editingSchool.id, data: formData });
    } else {
      createSchool.mutate(formData);
    }
  };

  const filteredSchools = schools?.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.name_bn?.includes(searchTerm)
  );

  const stats = {
    total: schools?.length || 0,
    active: schools?.filter(s => s.is_active && !s.is_suspended).length || 0,
    suspended: schools?.filter(s => s.is_suspended).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">স্কুল ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground font-bangla">সকল স্কুল পরিচালনা ও সাবস্ক্রিপশন নিয়ন্ত্রণ</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSchool(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="font-bangla">
                <Plus className="w-4 h-4 mr-2" />
                নতুন স্কুল
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingSchool ? 'স্কুল সম্পাদনা' : 'নতুন স্কুল যুক্ত করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">স্কুলের নাম (English)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">স্কুলের নাম (বাংলা)</Label>
                    <Input
                      value={formData.name_bn}
                      onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">স্কুল কোড</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SCH-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">সাবস্ক্রিপশন প্ল্যান</Label>
                    <Select
                      value={formData.subscription_plan}
                      onValueChange={(value: SubscriptionPlan) => setFormData({ ...formData, subscription_plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans?.map((plan) => (
                          <SelectItem key={plan.name} value={plan.name}>
                            <span className="font-bangla">{plan.name_bn || plan.name}</span>
                            <span className="text-muted-foreground ml-2">
                              (শিক্ষার্থী: {plan.max_students === -1 ? '∞' : plan.max_students})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bangla">ঠিকানা</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
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
                    <Label className="font-bangla">ইমেইল</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* School Admin Account Section - Only for new schools */}
                {!editingSchool && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="createAdmin"
                        checked={createAdminAccount}
                        onCheckedChange={(checked) => setCreateAdminAccount(checked as boolean)}
                      />
                      <Label htmlFor="createAdmin" className="font-bangla cursor-pointer">
                        স্কুল অ্যাডমিন একাউন্ট তৈরি করুন
                      </Label>
                    </div>
                    
                    {createAdminAccount && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-bangla">
                          <Key className="w-4 h-4" />
                          <span>স্কুল অ্যাডমিন লগইন তথ্য</span>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bangla">অ্যাডমিনের নাম</Label>
                          <Input
                            value={formData.admin_name}
                            onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                            placeholder="স্কুল অ্যাডমিন"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bangla">অ্যাডমিন ইমেইল *</Label>
                            <Input
                              type="email"
                              value={formData.admin_email}
                              onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                              placeholder="admin@school.com"
                              required={createAdminAccount}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bangla">পাসওয়ার্ড *</Label>
                            <Input
                              type="password"
                              value={formData.admin_password}
                              onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                              placeholder="••••••••"
                              required={createAdminAccount}
                              minLength={6}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" className="font-bangla" disabled={createSchool.isPending}>
                    {createSchool.isPending ? 'তৈরি হচ্ছে...' : editingSchool ? 'আপডেট করুন' : 'তৈরি করুন'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Credentials Display Dialog */}
          <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bangla flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-500" />
                  স্কুল অ্যাডমিন লগইন তথ্য
                </DialogTitle>
              </DialogHeader>
              {generatedCredentials && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300 font-bangla mb-3">
                      স্কুল অ্যাডমিন একাউন্ট সফলভাবে তৈরি হয়েছে। নিচের তথ্যগুলো সংরক্ষণ করুন।
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground font-bangla">স্কুল</Label>
                        <p className="font-medium">{generatedCredentials.schoolName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground font-bangla">ইমেইল</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-background px-3 py-2 rounded border text-sm">
                            {generatedCredentials.email}
                          </code>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedCredentials.email);
                              toast.success('ইমেইল কপি হয়েছে');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground font-bangla">পাসওয়ার্ড</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-background px-3 py-2 rounded border text-sm">
                            {generatedCredentials.password}
                          </code>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedCredentials.password);
                              toast.success('পাসওয়ার্ড কপি হয়েছে');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => {
                        setShowCredentials(false);
                        setGeneratedCredentials(null);
                      }}
                      className="font-bangla"
                    >
                      বন্ধ করুন
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground font-bangla">মোট স্কুল</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <PlayCircle className="w-6 h-6 text-green-500" />
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
                <div className="p-3 rounded-lg bg-red-500/10">
                  <PauseCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.suspended}</p>
                  <p className="text-sm text-muted-foreground font-bangla">স্থগিত</p>
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
              placeholder="স্কুল খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-bangla"
            />
          </div>
        </div>

        {/* Schools Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla">স্কুল</TableHead>
                  <TableHead className="font-bangla">কোড</TableHead>
                  <TableHead className="font-bangla">প্ল্যান</TableHead>
                  <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                  <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <span className="font-bangla">লোড হচ্ছে...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredSchools?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <span className="font-bangla">কোনো স্কুল পাওয়া যায়নি</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools?.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{school.name}</p>
                          {school.name_bn && (
                            <p className="text-sm text-muted-foreground font-bangla">{school.name_bn}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{school.code}</code>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[school.subscription_plan]}>
                          <span className="font-bangla">{planNames[school.subscription_plan]}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {school.is_suspended ? (
                          <Badge variant="destructive" className="font-bangla">স্থগিত</Badge>
                        ) : school.is_active ? (
                          <Badge variant="default" className="bg-green-500 font-bangla">সক্রিয়</Badge>
                        ) : (
                          <Badge variant="secondary" className="font-bangla">নিষ্ক্রিয়</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(school)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSchoolStatus.mutate({
                              id: school.id,
                              is_suspended: !school.is_suspended,
                              suspension_reason: !school.is_suspended ? 'Suspended by admin' : undefined,
                            })}
                          >
                            {school.is_suspended ? (
                              <PlayCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <PauseCircle className="w-4 h-4 text-orange-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('আপনি কি নিশ্চিত এই স্কুল মুছে ফেলতে চান?')) {
                                deleteSchool.mutate(school.id);
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
      </div>
    </DashboardLayout>
  );
}
