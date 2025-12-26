import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Users, BookOpen, Lock, Activity, 
  GraduationCap, FileText
} from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch student profile
  const { data: student, isLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ['student-activity-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('পাসওয়ার্ড মিলছে না');
      }
      if (passwordData.newPassword.length < 6) {
        throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      }
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-bangla">{student?.full_name_bn || student?.full_name}</h1>
            <p className="text-muted-foreground font-bangla">
              {student?.class} শ্রেণি {student?.section && `• ${student?.section} শাখা`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="font-bangla">রোল: {student?.roll_number}</Badge>
              <Badge variant="outline" className="font-bangla">ভর্তি আইডি: {student?.admission_id}</Badge>
              <Badge variant={student?.status === 'active' ? 'default' : 'secondary'} className="font-bangla">
                {student?.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 font-bangla">
            <TabsTrigger value="personal">ব্যক্তিগত তথ্য</TabsTrigger>
            <TabsTrigger value="guardian">অভিভাবক তথ্য</TabsTrigger>
            <TabsTrigger value="security">নিরাপত্তা</TabsTrigger>
            <TabsTrigger value="activity">কার্যকলাপ</TabsTrigger>
          </TabsList>

          {/* Personal Info */}
          <TabsContent value="personal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <User className="h-5 w-5" />
                    মৌলিক তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla text-muted-foreground">পুরো নাম (বাংলা)</Label>
                      <p className="font-medium font-bangla">{student?.full_name_bn || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">পুরো নাম (English)</Label>
                      <p className="font-medium">{student?.full_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">জন্ম তারিখ</Label>
                      <p className="font-medium">{student?.date_of_birth ? format(new Date(student.date_of_birth), 'dd/MM/yyyy') : '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">লিঙ্গ</Label>
                      <p className="font-medium font-bangla">{student?.gender === 'male' ? 'পুরুষ' : student?.gender === 'female' ? 'মহিলা' : '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">রক্তের গ্রুপ</Label>
                      <p className="font-medium">{student?.blood_group || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">ধর্ম</Label>
                      <p className="font-medium font-bangla">{student?.religion || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">জাতীয়তা</Label>
                      <p className="font-medium font-bangla">{student?.nationality || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">জন্ম সনদ নং</Label>
                      <p className="font-medium">{student?.birth_certificate_no || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    একাডেমিক তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla text-muted-foreground">শ্রেণি</Label>
                      <p className="font-medium font-bangla">{student?.class}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">শাখা</Label>
                      <p className="font-medium font-bangla">{student?.section || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">রোল নম্বর</Label>
                      <p className="font-medium">{student?.roll_number}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">শিফট</Label>
                      <p className="font-medium font-bangla">{student?.shift || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">গ্রুপ/বিভাগ</Label>
                      <p className="font-medium font-bangla">{student?.group_stream || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">ভর্তির তারিখ</Label>
                      <p className="font-medium">{student?.admission_date ? format(new Date(student.admission_date), 'dd/MM/yyyy') : '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">শিক্ষাবর্ষ</Label>
                      <p className="font-medium">{student?.academic_year || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">পূর্ববর্তী স্কুল</Label>
                      <p className="font-medium font-bangla">{student?.previous_school || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    ঠিকানা ও যোগাযোগ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla text-muted-foreground">বর্তমান ঠিকানা</Label>
                      <p className="font-medium font-bangla">{student?.present_address || '-'}</p>
                      <p className="text-sm text-muted-foreground font-bangla">
                        {student?.present_upazila && `${student.present_upazila}, `}
                        {student?.present_district}
                      </p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">স্থায়ী ঠিকানা</Label>
                      <p className="font-medium font-bangla">{student?.permanent_address || '-'}</p>
                      <p className="text-sm text-muted-foreground font-bangla">
                        {student?.permanent_upazila && `${student.permanent_upazila}, `}
                        {student?.permanent_district}
                      </p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">ইমেইল</Label>
                      <p className="font-medium">{student?.email || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">মোবাইল</Label>
                      <p className="font-medium">{student?.phone || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Guardian Info */}
          <TabsContent value="guardian">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    পিতা-মাতার তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla text-muted-foreground">পিতার নাম (বাংলা)</Label>
                      <p className="font-medium font-bangla">{student?.father_name_bn || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">পিতার নাম (English)</Label>
                      <p className="font-medium">{student?.father_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">মাতার নাম (বাংলা)</Label>
                      <p className="font-medium font-bangla">{student?.mother_name_bn || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">মাতার নাম (English)</Label>
                      <p className="font-medium">{student?.mother_name || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    অভিভাবকের তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla text-muted-foreground">অভিভাবকের নাম</Label>
                      <p className="font-medium font-bangla">{student?.guardian_name_bn || student?.guardian_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">সম্পর্ক</Label>
                      <p className="font-medium font-bangla">{student?.guardian_relation || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">মোবাইল নম্বর</Label>
                      <p className="font-medium">{student?.guardian_mobile || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">পেশা</Label>
                      <p className="font-medium font-bangla">{student?.guardian_occupation || '-'}</p>
                    </div>
                    <div>
                      <Label className="font-bangla text-muted-foreground">বিকল্প নম্বর</Label>
                      <p className="font-medium">{student?.alternative_contact || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  পাসওয়ার্ড পরিবর্তন
                </CardTitle>
              </CardHeader>
              <CardContent className="max-w-md space-y-4">
                <div>
                  <Label className="font-bangla">নতুন পাসওয়ার্ড</Label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="নতুন পাসওয়ার্ড"
                    className="font-bangla"
                  />
                </div>
                <div>
                  <Label className="font-bangla">পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    className="font-bangla"
                  />
                </div>
                <Button 
                  onClick={() => changePasswordMutation.mutate()}
                  disabled={changePasswordMutation.isPending}
                  className="font-bangla"
                >
                  {changePasswordMutation.isPending ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  সাম্প্রতিক কার্যকলাপ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLogs && activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.entity_type}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at!), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6 font-bangla">
                    কোনো কার্যকলাপ পাওয়া যায়নি
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
