import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, School, BookOpen, CreditCard, Bell, Users } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    school_name: 'আদর্শ বিদ্যালয়',
    school_name_en: 'Adarsha Bidyalaya',
    academic_year: '২০২৬',
    phone: '+880 1234 567890',
    email: 'info@school.edu.bd',
    address: '১২৩ শিক্ষা সড়ক, ঢাকা-১২০০',
    auto_confirm_email: true,
    fee_reminder_days: 7,
    attendance_threshold: 75,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from('system_settings').upsert({ key, value: { data: value }, category: 'general' }, { onConflict: 'key' });
      }
    },
    onSuccess: () => {
      toast({ title: 'সফল!', description: 'সেটিংস সংরক্ষিত হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-bangla">সেটিংস</h1>
            <p className="text-muted-foreground font-bangla">সিস্টেম কনফিগারেশন</p>
          </div>
          <Button onClick={() => saveSettingsMutation.mutate()} className="font-bangla">
            <Save className="w-4 h-4 mr-2" /> সংরক্ষণ
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="general" className="font-bangla"><School className="w-4 h-4 mr-1" /> সাধারণ</TabsTrigger>
            <TabsTrigger value="academic" className="font-bangla"><BookOpen className="w-4 h-4 mr-1" /> শিক্ষা</TabsTrigger>
            <TabsTrigger value="financial" className="font-bangla"><CreditCard className="w-4 h-4 mr-1" /> আর্থিক</TabsTrigger>
            <TabsTrigger value="notification" className="font-bangla"><Bell className="w-4 h-4 mr-1" /> নোটিফিকেশন</TabsTrigger>
            <TabsTrigger value="users" className="font-bangla"><Users className="w-4 h-4 mr-1" /> ব্যবহারকারী</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">প্রতিষ্ঠানের তথ্য</CardTitle>
                <CardDescription className="font-bangla">বিদ্যালয়ের মৌলিক তথ্য</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label className="font-bangla">বিদ্যালয়ের নাম (বাংলা)</Label><Input value={settings.school_name} onChange={(e) => setSettings({...settings, school_name: e.target.value})} className="font-bangla" /></div>
                  <div><Label className="font-bangla">বিদ্যালয়ের নাম (ইংরেজি)</Label><Input value={settings.school_name_en} onChange={(e) => setSettings({...settings, school_name_en: e.target.value})} /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label className="font-bangla">ফোন</Label><Input value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} /></div>
                  <div><Label className="font-bangla">ইমেইল</Label><Input value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} /></div>
                </div>
                <div><Label className="font-bangla">ঠিকানা</Label><Input value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="font-bangla" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader><CardTitle className="font-bangla">শিক্ষা সেটিংস</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="font-bangla">বর্তমান শিক্ষাবর্ষ</Label><Input value={settings.academic_year} onChange={(e) => setSettings({...settings, academic_year: e.target.value})} className="font-bangla" /></div>
                <div><Label className="font-bangla">ন্যূনতম উপস্থিতি (%)</Label><Input type="number" value={settings.attendance_threshold} onChange={(e) => setSettings({...settings, attendance_threshold: Number(e.target.value)})} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader><CardTitle className="font-bangla">আর্থিক সেটিংস</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="font-bangla">ফি রিমাইন্ডার (দিন আগে)</Label><Input type="number" value={settings.fee_reminder_days} onChange={(e) => setSettings({...settings, fee_reminder_days: Number(e.target.value)})} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notification">
            <Card>
              <CardHeader><CardTitle className="font-bangla">নোটিফিকেশন সেটিংস</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bangla">ইমেইল অটো-কনফার্ম</Label>
                  <Switch checked={settings.auto_confirm_email} onCheckedChange={(v) => setSettings({...settings, auto_confirm_email: v})} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="font-bangla">ব্যবহারকারী ম্যানেজমেন্ট</CardTitle><CardDescription className="font-bangla">রোল ও পারমিশন</CardDescription></CardHeader>
              <CardContent><p className="text-muted-foreground font-bangla">ব্যবহারকারী ম্যানেজমেন্ট ফিচার শীঘ্রই আসছে...</p></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
