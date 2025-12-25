import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Save, Globe, Shield, Bell, Database, Mail, 
  Palette, Clock, Lock, Key, RefreshCw, CheckCircle,
  AlertTriangle, Settings2, Server
} from 'lucide-react';

interface SystemSetting {
  key: string;
  value: any;
  category: string;
}

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    // General
    platform_name: 'স্কুল ম্যানেজমেন্ট সিস্টেম',
    platform_name_en: 'School Management System',
    support_email: 'support@school.com',
    support_phone: '+880 1234 567890',
    timezone: 'Asia/Dhaka',
    date_format: 'DD/MM/YYYY',
    
    // Security
    password_min_length: 8,
    session_timeout: 60,
    max_login_attempts: 5,
    require_2fa_admin: false,
    allow_registration: true,
    auto_confirm_email: true,
    
    // Notifications
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    notification_digest: 'daily',
    
    // Limits
    max_schools: 1000,
    max_storage_per_school: 5120,
    default_plan: 'basic',
    trial_days: 14,
    
    // Maintenance
    maintenance_mode: false,
    maintenance_message: 'সিস্টেম রক্ষণাবেক্ষণের কাজ চলছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      if (error) throw error;
      
      // Merge with defaults
      const merged = { ...settings } as Record<string, any>;
      data?.forEach((setting: any) => {
        if (setting.key in merged) {
          merged[setting.key] = setting.value?.data ?? setting.value;
        }
      });
      setSettings(merged as typeof settings);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        const category = 
          ['platform_name', 'platform_name_en', 'support_email', 'support_phone', 'timezone', 'date_format'].includes(key) ? 'general' :
          ['password_min_length', 'session_timeout', 'max_login_attempts', 'require_2fa_admin', 'allow_registration', 'auto_confirm_email'].includes(key) ? 'security' :
          ['email_notifications', 'sms_notifications', 'push_notifications', 'notification_digest'].includes(key) ? 'notifications' :
          ['max_schools', 'max_storage_per_school', 'default_plan', 'trial_days'].includes(key) ? 'limits' : 'maintenance';
          
        await supabase.from('system_settings').upsert(
          { key, value: { data: value }, category },
          { onConflict: 'key' }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('সেটিংস সফলভাবে সংরক্ষিত হয়েছে');
    },
    onError: (error: any) => {
      toast.error(error.message || 'সেটিংস সংরক্ষণে সমস্যা হয়েছে');
    },
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Settings2 className="w-7 h-7" />
              সিস্টেম সেটিংস
            </h1>
            <p className="text-muted-foreground font-bangla">প্ল্যাটফর্ম কনফিগারেশন ও নিয়ন্ত্রণ</p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            className="font-bangla"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সব সংরক্ষণ করুন'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="general" className="font-bangla gap-2">
              <Globe className="w-4 h-4" /> সাধারণ
            </TabsTrigger>
            <TabsTrigger value="security" className="font-bangla gap-2">
              <Shield className="w-4 h-4" /> নিরাপত্তা
            </TabsTrigger>
            <TabsTrigger value="notifications" className="font-bangla gap-2">
              <Bell className="w-4 h-4" /> নোটিফিকেশন
            </TabsTrigger>
            <TabsTrigger value="limits" className="font-bangla gap-2">
              <Database className="w-4 h-4" /> সীমা
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="font-bangla gap-2">
              <Server className="w-4 h-4" /> রক্ষণাবেক্ষণ
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  প্ল্যাটফর্ম তথ্য
                </CardTitle>
                <CardDescription className="font-bangla">মৌলিক প্ল্যাটফর্ম কনফিগারেশন</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bangla">প্ল্যাটফর্ম নাম (বাংলা)</Label>
                    <Input 
                      value={settings.platform_name} 
                      onChange={(e) => updateSetting('platform_name', e.target.value)}
                      className="font-bangla"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">প্ল্যাটফর্ম নাম (ইংরেজি)</Label>
                    <Input 
                      value={settings.platform_name_en} 
                      onChange={(e) => updateSetting('platform_name_en', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bangla">সাপোর্ট ইমেইল</Label>
                    <Input 
                      type="email"
                      value={settings.support_email} 
                      onChange={(e) => updateSetting('support_email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">সাপোর্ট ফোন</Label>
                    <Input 
                      value={settings.support_phone} 
                      onChange={(e) => updateSetting('support_phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bangla">টাইমজোন</Label>
                    <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Dhaka">Asia/Dhaka (BST +6)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">তারিখ ফরম্যাট</Label>
                    <Select value={settings.date_format} onValueChange={(v) => updateSetting('date_format', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  নিরাপত্তা সেটিংস
                </CardTitle>
                <CardDescription className="font-bangla">অথেনটিকেশন ও অ্যাক্সেস কন্ট্রোল</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bangla">ন্যূনতম পাসওয়ার্ড দৈর্ঘ্য</Label>
                    <Input 
                      type="number"
                      value={settings.password_min_length} 
                      onChange={(e) => updateSetting('password_min_length', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">সেশন টাইমআউট (মিনিট)</Label>
                    <Input 
                      type="number"
                      value={settings.session_timeout} 
                      onChange={(e) => updateSetting('session_timeout', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">সর্বোচ্চ লগইন প্রচেষ্টা</Label>
                    <Input 
                      type="number"
                      value={settings.max_login_attempts} 
                      onChange={(e) => updateSetting('max_login_attempts', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-bangla">অ্যাডমিনদের জন্য 2FA আবশ্যক</Label>
                      <p className="text-sm text-muted-foreground font-bangla">সকল অ্যাডমিনের জন্য টু-ফ্যাক্টর অথেনটিকেশন</p>
                    </div>
                    <Switch 
                      checked={settings.require_2fa_admin} 
                      onCheckedChange={(v) => updateSetting('require_2fa_admin', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-bangla">রেজিস্ট্রেশন অনুমতি</Label>
                      <p className="text-sm text-muted-foreground font-bangla">নতুন ব্যবহারকারী নিবন্ধন করতে পারবে</p>
                    </div>
                    <Switch 
                      checked={settings.allow_registration} 
                      onCheckedChange={(v) => updateSetting('allow_registration', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="font-bangla">অটো-কনফার্ম ইমেইল</Label>
                      <p className="text-sm text-muted-foreground font-bangla">ইমেইল ভেরিফিকেশন ছাড়াই একাউন্ট সক্রিয়</p>
                    </div>
                    <Switch 
                      checked={settings.auto_confirm_email} 
                      onCheckedChange={(v) => updateSetting('auto_confirm_email', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  নোটিফিকেশন সেটিংস
                </CardTitle>
                <CardDescription className="font-bangla">সিস্টেম নোটিফিকেশন কনফিগারেশন</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label className="font-bangla">ইমেইল নোটিফিকেশন</Label>
                        <p className="text-sm text-muted-foreground font-bangla">গুরুত্বপূর্ণ আপডেট ইমেইলে পাঠান</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.email_notifications} 
                      onCheckedChange={(v) => updateSetting('email_notifications', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label className="font-bangla">পুশ নোটিফিকেশন</Label>
                        <p className="text-sm text-muted-foreground font-bangla">ব্রাউজার পুশ নোটিফিকেশন</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.push_notifications} 
                      onCheckedChange={(v) => updateSetting('push_notifications', v)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bangla">নোটিফিকেশন ডাইজেস্ট</Label>
                  <Select value={settings.notification_digest} onValueChange={(v) => updateSetting('notification_digest', v)}>
                    <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">রিয়েলটাইম</SelectItem>
                      <SelectItem value="hourly">প্রতি ঘন্টায়</SelectItem>
                      <SelectItem value="daily">প্রতিদিন</SelectItem>
                      <SelectItem value="weekly">প্রতি সপ্তাহে</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Limits Settings */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  সিস্টেম সীমা
                </CardTitle>
                <CardDescription className="font-bangla">রিসোর্স লিমিট ও ডিফল্ট মান</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bangla">সর্বোচ্চ স্কুল সংখ্যা</Label>
                    <Input 
                      type="number"
                      value={settings.max_schools} 
                      onChange={(e) => updateSetting('max_schools', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">প্রতি স্কুল স্টোরেজ (MB)</Label>
                    <Input 
                      type="number"
                      value={settings.max_storage_per_school} 
                      onChange={(e) => updateSetting('max_storage_per_school', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bangla">ডিফল্ট সাবস্ক্রিপশন প্ল্যান</Label>
                    <Select value={settings.default_plan} onValueChange={(v) => updateSetting('default_plan', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">বেসিক</SelectItem>
                        <SelectItem value="standard">স্ট্যান্ডার্ড</SelectItem>
                        <SelectItem value="premium">প্রিমিয়াম</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">ট্রায়াল পিরিয়ড (দিন)</Label>
                    <Input 
                      type="number"
                      value={settings.trial_days} 
                      onChange={(e) => updateSetting('trial_days', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Settings */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  রক্ষণাবেক্ষণ মোড
                </CardTitle>
                <CardDescription className="font-bangla">সিস্টেম মেইনটেন্যান্স কন্ট্রোল</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <Label className="font-bangla">মেইনটেন্যান্স মোড</Label>
                      <p className="text-sm text-muted-foreground font-bangla">সক্রিয় করলে শুধুমাত্র সুপার অ্যাডমিন অ্যাক্সেস পাবে</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.maintenance_mode} 
                    onCheckedChange={(v) => updateSetting('maintenance_mode', v)}
                  />
                </div>
                {settings.maintenance_mode && (
                  <div className="space-y-2">
                    <Label className="font-bangla">মেইনটেন্যান্স মেসেজ</Label>
                    <Textarea 
                      value={settings.maintenance_message}
                      onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                      className="font-bangla"
                      rows={3}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-500/5">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bangla">সিস্টেম বর্তমানে সক্রিয় আছে</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
