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
  AlertTriangle, Settings2, Server, CreditCard, Eye, EyeOff
} from 'lucide-react';

interface SystemSetting {
  key: string;
  value: any;
  category: string;
}

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

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

  // Payment Gateway Settings
  const [paymentSettings, setPaymentSettings] = useState({
    // bKash
    bkash_enabled: false,
    bkash_app_key: '',
    bkash_app_secret: '',
    bkash_username: '',
    bkash_password: '',
    bkash_is_sandbox: true,
    
    // SSLCommerz
    sslcommerz_enabled: false,
    sslcommerz_store_id: '',
    sslcommerz_store_password: '',
    sslcommerz_is_sandbox: true,
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

      // Load payment gateway configs
      const bkashConfig = data?.find(s => s.key === 'bkash_config');
      const sslConfig = data?.find(s => s.key === 'sslcommerz_config');
      
      const bkashData = bkashConfig?.value as Record<string, any> | null;
      const sslData = sslConfig?.value as Record<string, any> | null;
      
      setPaymentSettings(prev => ({
        ...prev,
        bkash_enabled: bkashData?.data?.enabled || false,
        bkash_app_key: bkashData?.data?.app_key || '',
        bkash_app_secret: bkashData?.data?.app_secret || '',
        bkash_username: bkashData?.data?.username || '',
        bkash_password: bkashData?.data?.password || '',
        bkash_is_sandbox: bkashData?.data?.is_sandbox ?? true,
        sslcommerz_enabled: sslData?.data?.enabled || false,
        sslcommerz_store_id: sslData?.data?.store_id || '',
        sslcommerz_store_password: sslData?.data?.store_password || '',
        sslcommerz_is_sandbox: sslData?.data?.is_sandbox ?? true,
      }));

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

  const savePaymentSettings = useMutation({
    mutationFn: async () => {
      // Save bKash config
      await supabase.from('system_settings').upsert(
        { 
          key: 'bkash_config', 
          value: { 
            data: {
              enabled: paymentSettings.bkash_enabled,
              app_key: paymentSettings.bkash_app_key,
              app_secret: paymentSettings.bkash_app_secret,
              username: paymentSettings.bkash_username,
              password: paymentSettings.bkash_password,
              is_sandbox: paymentSettings.bkash_is_sandbox,
            }
          }, 
          category: 'payment' 
        },
        { onConflict: 'key' }
      );

      // Save SSLCommerz config
      await supabase.from('system_settings').upsert(
        { 
          key: 'sslcommerz_config', 
          value: { 
            data: {
              enabled: paymentSettings.sslcommerz_enabled,
              store_id: paymentSettings.sslcommerz_store_id,
              store_password: paymentSettings.sslcommerz_store_password,
              is_sandbox: paymentSettings.sslcommerz_is_sandbox,
            }
          }, 
          category: 'payment' 
        },
        { onConflict: 'key' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('পেমেন্ট গেটওয়ে সেটিংস সংরক্ষিত হয়েছে');
    },
    onError: (error: any) => {
      toast.error(error.message || 'পেমেন্ট সেটিংস সংরক্ষণে সমস্যা হয়েছে');
    },
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePaymentSetting = (key: string, value: any) => {
    setPaymentSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
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
            onClick={() => {
              if (activeTab === 'payment') {
                savePaymentSettings.mutate();
              } else {
                saveMutation.mutate();
              }
            }} 
            disabled={saveMutation.isPending || savePaymentSettings.isPending}
            className="font-bangla"
          >
            <Save className="w-4 h-4 mr-2" />
            {(saveMutation.isPending || savePaymentSettings.isPending) ? 'সংরক্ষণ হচ্ছে...' : 'সব সংরক্ষণ করুন'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
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
            <TabsTrigger value="payment" className="font-bangla gap-2">
              <CreditCard className="w-4 h-4" /> পেমেন্ট
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

          {/* Payment Gateway Settings */}
          <TabsContent value="payment">
            <div className="space-y-6">
              {/* bKash Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center text-white text-2xl">
                        🟪
                      </div>
                      <div>
                        <CardTitle className="font-bangla flex items-center gap-2">
                          বিকাশ (bKash)
                        </CardTitle>
                        <CardDescription className="font-bangla">বিকাশ পেমেন্ট গেটওয়ে কনফিগারেশন</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={paymentSettings.bkash_is_sandbox ? 'secondary' : 'default'}>
                        {paymentSettings.bkash_is_sandbox ? 'Sandbox' : 'Production'}
                      </Badge>
                      <Switch
                        checked={paymentSettings.bkash_enabled}
                        onCheckedChange={(v) => updatePaymentSetting('bkash_enabled', v)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      id="bkash-sandbox"
                      checked={paymentSettings.bkash_is_sandbox}
                      onCheckedChange={(v) => updatePaymentSetting('bkash_is_sandbox', v)}
                    />
                    <Label htmlFor="bkash-sandbox" className="font-bangla">
                      Sandbox/Test মোড
                    </Label>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bangla">App Key</Label>
                      <div className="relative">
                        <Input 
                          type={showSecrets['bkash_app_key'] ? 'text' : 'password'}
                          value={paymentSettings.bkash_app_key}
                          onChange={(e) => updatePaymentSetting('bkash_app_key', e.target.value)}
                          placeholder="Enter bKash App Key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => toggleSecret('bkash_app_key')}
                        >
                          {showSecrets['bkash_app_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bangla">App Secret</Label>
                      <div className="relative">
                        <Input 
                          type={showSecrets['bkash_app_secret'] ? 'text' : 'password'}
                          value={paymentSettings.bkash_app_secret}
                          onChange={(e) => updatePaymentSetting('bkash_app_secret', e.target.value)}
                          placeholder="Enter bKash App Secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => toggleSecret('bkash_app_secret')}
                        >
                          {showSecrets['bkash_app_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bangla">Username</Label>
                      <Input 
                        value={paymentSettings.bkash_username}
                        onChange={(e) => updatePaymentSetting('bkash_username', e.target.value)}
                        placeholder="Enter bKash Username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bangla">Password</Label>
                      <div className="relative">
                        <Input 
                          type={showSecrets['bkash_password'] ? 'text' : 'password'}
                          value={paymentSettings.bkash_password}
                          onChange={(e) => updatePaymentSetting('bkash_password', e.target.value)}
                          placeholder="Enter bKash Password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => toggleSecret('bkash_password')}
                        >
                          {showSecrets['bkash_password'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground font-bangla">
                    <p>📌 বিকাশ মার্চেন্ট একাউন্ট থেকে এই তথ্যগুলো সংগ্রহ করুন।</p>
                    <p className="mt-1">🔗 <a href="https://developer.bka.sh" target="_blank" rel="noopener noreferrer" className="text-primary underline">bKash Developer Portal</a></p>
                  </div>
                </CardContent>
              </Card>

              {/* SSLCommerz Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                        SSL
                      </div>
                      <div>
                        <CardTitle className="font-bangla flex items-center gap-2">
                          SSLCommerz
                        </CardTitle>
                        <CardDescription className="font-bangla">SSLCommerz পেমেন্ট গেটওয়ে কনফিগারেশন</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={paymentSettings.sslcommerz_is_sandbox ? 'secondary' : 'default'}>
                        {paymentSettings.sslcommerz_is_sandbox ? 'Sandbox' : 'Production'}
                      </Badge>
                      <Switch
                        checked={paymentSettings.sslcommerz_enabled}
                        onCheckedChange={(v) => updatePaymentSetting('sslcommerz_enabled', v)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      id="ssl-sandbox"
                      checked={paymentSettings.sslcommerz_is_sandbox}
                      onCheckedChange={(v) => updatePaymentSetting('sslcommerz_is_sandbox', v)}
                    />
                    <Label htmlFor="ssl-sandbox" className="font-bangla">
                      Sandbox/Test মোড
                    </Label>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bangla">Store ID</Label>
                      <Input 
                        value={paymentSettings.sslcommerz_store_id}
                        onChange={(e) => updatePaymentSetting('sslcommerz_store_id', e.target.value)}
                        placeholder="Enter Store ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bangla">Store Password</Label>
                      <div className="relative">
                        <Input 
                          type={showSecrets['ssl_store_password'] ? 'text' : 'password'}
                          value={paymentSettings.sslcommerz_store_password}
                          onChange={(e) => updatePaymentSetting('sslcommerz_store_password', e.target.value)}
                          placeholder="Enter Store Password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => toggleSecret('ssl_store_password')}
                        >
                          {showSecrets['ssl_store_password'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground font-bangla">
                    <p>📌 SSLCommerz মার্চেন্ট প্যানেল থেকে Store ID ও Password সংগ্রহ করুন।</p>
                    <p className="mt-1">🔗 <a href="https://developer.sslcommerz.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">SSLCommerz Developer Portal</a></p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Gateway Info */}
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm font-bangla">
                      <p className="font-medium text-blue-800">গুরুত্বপূর্ণ তথ্য</p>
                      <ul className="mt-2 space-y-1 text-blue-700">
                        <li>• Production মোডে যাওয়ার আগে সব Credentials যাচাই করুন</li>
                        <li>• Sandbox মোডে টেস্ট করে দেখুন পেমেন্ট সিস্টেম কাজ করছে কিনা</li>
                        <li>• Callback URL গুলো সঠিকভাবে কনফিগার করা আছে কিনা নিশ্চিত করুন</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
