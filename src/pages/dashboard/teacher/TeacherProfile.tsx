import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase,
  GraduationCap, Save, Key, Activity, Clock, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function TeacherProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch teacher info
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState<any>({});

  // Initialize form data when teacher data loads
  const initFormData = () => {
    if (teacher) {
      setFormData({
        full_name: teacher.full_name || '',
        full_name_bn: teacher.full_name_bn || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        date_of_birth: teacher.date_of_birth || '',
        blood_group: teacher.blood_group || '',
        emergency_contact: teacher.emergency_contact || '',
        emergency_contact_relation: teacher.emergency_contact_relation || '',
      });
    }
  };

  // Fetch activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ['teacher-activity-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data;
    },
    enabled: !!user?.id && activeTab === 'activity',
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('teachers')
        .update(formData)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'আপডেট করতে সমস্যা হয়েছে');
    },
  });

  // Password change
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordData.new !== passwordData.confirm) {
        throw new Error('নতুন পাসওয়ার্ড মিলছে না');
      }
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
      setPasswordData({ current: '', new: '', confirm: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <User className="w-7 h-7" />
              আমার প্রোফাইল
            </h1>
            <p className="text-muted-foreground font-bangla">
              আপনার প্রোফাইল তথ্য ও সেটিংস
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                {teacher?.full_name?.[0] || 'T'}
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold font-bangla">
                  {teacher?.full_name_bn || teacher?.full_name}
                </h2>
                <p className="text-muted-foreground">{teacher?.designation || 'শিক্ষক'}</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                  <Badge variant="outline">ID: {teacher?.employee_id}</Badge>
                  <Badge variant="secondary" className="font-bangla">{teacher?.department || 'সাধারণ বিভাগ'}</Badge>
                  <Badge variant={teacher?.status === 'active' ? 'default' : 'destructive'}>
                    {teacher?.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </Badge>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm text-muted-foreground font-bangla">যোগদান</p>
                <p className="font-medium">
                  {teacher?.joining_date && format(new Date(teacher.joining_date), 'dd MMM yyyy', { locale: bn })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-xl">
            <TabsTrigger value="profile" className="flex-1 font-bangla gap-2">
              <User className="w-4 h-4" /> প্রোফাইল
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex-1 font-bangla gap-2">
              <BookOpen className="w-4 h-4" /> ক্লাস ও বিষয়
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 font-bangla gap-2">
              <Key className="w-4 h-4" /> নিরাপত্তা
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 font-bangla gap-2">
              <Activity className="w-4 h-4" /> কার্যকলাপ
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-bangla">ব্যক্তিগত তথ্য</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => { initFormData(); setIsEditing(true); }} className="font-bangla">
                    সম্পাদনা করুন
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="font-bangla">বাতিল</Button>
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="font-bangla">
                      <Save className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-bangla">নাম (ইংরেজি)</p>
                        {isEditing ? (
                          <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                        ) : (
                          <p className="font-medium">{teacher?.full_name || '-'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-bangla">নাম (বাংলা)</p>
                        {isEditing ? (
                          <Input value={formData.full_name_bn} onChange={(e) => setFormData({ ...formData, full_name_bn: e.target.value })} className="font-bangla" />
                        ) : (
                          <p className="font-medium font-bangla">{teacher?.full_name_bn || '-'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-bangla">ইমেইল</p>
                        {isEditing ? (
                          <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        ) : (
                          <p className="font-medium">{teacher?.email || '-'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-bangla">মোবাইল</p>
                        {isEditing ? (
                          <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        ) : (
                          <p className="font-medium">{teacher?.phone || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-bangla">জন্ম তারিখ</p>
                        {isEditing ? (
                          <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                        ) : (
                          <p className="font-medium">{teacher?.date_of_birth || '-'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground font-bangla">পদবী</p>
                        <p className="font-medium font-bangla">{teacher?.designation || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground font-bangla">যোগ্যতা</p>
                        <p className="font-medium">{teacher?.qualification || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-bangla">ঠিকানা</p>
                        {isEditing ? (
                          <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="font-bangla" />
                        ) : (
                          <p className="font-medium font-bangla">{teacher?.address || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> অ্যাসাইনড ক্লাস
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher?.assigned_classes?.length ? (
                      teacher.assigned_classes.map((cls: string) => (
                        <Badge key={cls} variant="secondary" className="text-lg px-4 py-2 font-bangla">
                          {cls} শ্রেণি
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground font-bangla">কোনো ক্লাস অ্যাসাইন করা হয়নি</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" /> পাঠদানের বিষয়
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher?.subjects_taught?.length ? (
                      teacher.subjects_taught.map((sub: string) => (
                        <Badge key={sub} variant="outline" className="text-lg px-4 py-2 font-bangla">
                          {sub}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground font-bangla">কোনো বিষয় অ্যাসাইন করা হয়নি</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Key className="w-5 h-5" /> পাসওয়ার্ড পরিবর্তন
                </CardTitle>
              </CardHeader>
              <CardContent className="max-w-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">নতুন পাসওয়ার্ড</Label>
                    <Input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      placeholder="নতুন পাসওয়ার্ড দিন"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">পাসওয়ার্ড নিশ্চিত করুন</Label>
                    <Input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      placeholder="পাসওয়ার্ড আবার দিন"
                    />
                  </div>
                  <Button 
                    onClick={() => changePasswordMutation.mutate()} 
                    disabled={changePasswordMutation.isPending || !passwordData.new}
                    className="font-bangla"
                  >
                    {changePasswordMutation.isPending ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Activity className="w-5 h-5" /> সাম্প্রতিক কার্যকলাপ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLogs?.length ? (
                  <div className="space-y-3">
                    {activityLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{log.action} - {log.entity_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.created_at && format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a', { locale: bn })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 font-bangla">
                    কোনো কার্যকলাপ লগ নেই
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
