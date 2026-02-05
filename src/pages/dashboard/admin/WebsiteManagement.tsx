import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, Home, Info, Bell, Users, Image, Phone, Settings, 
  Save, Eye, RefreshCw, Plus, Trash2, GripVertical, ExternalLink
} from 'lucide-react';

// Home Content Editor
function HomeContentEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [heroData, setHeroData] = useState({
    title: '',
    title_bn: '',
    content: '',
    content_bn: '',
    image_url: '',
  });

  const { data: content, isLoading } = useQuery({
    queryKey: ['website-content', 'home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('page', 'home');
      if (error) throw error;
      return data;
    },
  });

  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ['website-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_features')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['website-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_stats')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const saveContentMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      const payload = {
        page: 'home',
        section,
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('website_content')
        .upsert(payload, { onConflict: 'school_id,page,section' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-content'] });
      toast({ title: 'সফল!', description: 'কনটেন্ট সংরক্ষিত হয়েছে' });
    },
    onError: (err: any) => toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' }),
  });

  const addFeatureMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('website_features').insert({
        title: 'নতুন ফিচার',
        title_bn: 'নতুন ফিচার',
        description: 'বিবরণ লিখুন',
        description_bn: 'বিবরণ লিখুন',
        display_order: (features?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-features'] });
      toast({ title: 'ফিচার যোগ হয়েছে' });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('website_features').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-features'] });
      toast({ title: 'আপডেট হয়েছে' });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('website_features').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-features'] });
      toast({ title: 'মুছে ফেলা হয়েছে' });
    },
  });

  const addStatMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('website_stats').insert({
        label: 'নতুন স্ট্যাট',
        label_bn: 'নতুন স্ট্যাট',
        value: '0',
        display_order: (stats?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-stats'] });
    },
  });

  const updateStatMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('website_stats').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['website-stats'] }),
  });

  const deleteStatMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('website_stats').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['website-stats'] }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin" /></div>;
  }

  const heroContent = content?.find(c => c.section === 'hero');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bangla">হিরো সেকশন</CardTitle>
          <CardDescription className="font-bangla">হোম পেজের প্রধান ব্যানার</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">শিরোনাম (ইংরেজি)</Label>
              <Input
                defaultValue={heroContent?.title || ''}
                onChange={(e) => setHeroData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Welcome to Our School"
              />
            </div>
            <div>
              <Label className="font-bangla">শিরোনাম (বাংলা)</Label>
              <Input
                defaultValue={heroContent?.title_bn || ''}
                onChange={(e) => setHeroData(prev => ({ ...prev, title_bn: e.target.value }))}
                placeholder="আমাদের স্কুলে স্বাগতম"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">সাব-শিরোনাম (ইংরেজি)</Label>
              <Textarea
                defaultValue={heroContent?.content || ''}
                onChange={(e) => setHeroData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label className="font-bangla">সাব-শিরোনাম (বাংলা)</Label>
              <Textarea
                defaultValue={heroContent?.content_bn || ''}
                onChange={(e) => setHeroData(prev => ({ ...prev, content_bn: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <div>
            <Label className="font-bangla">ব্যাকগ্রাউন্ড ইমেজ URL</Label>
            <Input
              defaultValue={heroContent?.image_url || ''}
              onChange={(e) => setHeroData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <Button 
            onClick={() => saveContentMutation.mutate({ section: 'hero', data: heroData })}
            disabled={saveContentMutation.isPending}
            className="font-bangla"
          >
            {saveContentMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Features Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-bangla">ফিচার সেকশন</CardTitle>
            <CardDescription className="font-bangla">স্কুলের বৈশিষ্ট্যগুলো</CardDescription>
          </div>
          <Button onClick={() => addFeatureMutation.mutate()} size="sm" className="font-bangla">
            <Plus className="w-4 h-4 mr-1" /> যোগ করুন
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {features?.map((feature, idx) => (
            <div key={feature.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  <span className="font-medium font-bangla">ফিচার #{idx + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={feature.is_published}
                    onCheckedChange={(checked) => updateFeatureMutation.mutate({ id: feature.id, data: { is_published: checked } })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFeatureMutation.mutate(feature.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  defaultValue={feature.title_bn}
                  placeholder="শিরোনাম (বাংলা)"
                  onBlur={(e) => updateFeatureMutation.mutate({ id: feature.id, data: { title_bn: e.target.value, title: e.target.value } })}
                />
                <Input
                  defaultValue={feature.description_bn || ''}
                  placeholder="বিবরণ (বাংলা)"
                  onBlur={(e) => updateFeatureMutation.mutate({ id: feature.id, data: { description_bn: e.target.value, description: e.target.value } })}
                />
              </div>
            </div>
          ))}
          {(!features || features.length === 0) && (
            <p className="text-muted-foreground text-center py-8 font-bangla">কোনো ফিচার নেই। যোগ করুন বাটনে ক্লিক করুন।</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-bangla">পরিসংখ্যান সেকশন</CardTitle>
            <CardDescription className="font-bangla">সংখ্যা ও পরিসংখ্যান</CardDescription>
          </div>
          <Button onClick={() => addStatMutation.mutate()} size="sm" className="font-bangla">
            <Plus className="w-4 h-4 mr-1" /> যোগ করুন
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats?.map((stat) => (
              <div key={stat.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => deleteStatMutation.mutate(stat.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <Input
                  defaultValue={stat.value}
                  placeholder="মান (যেমন: ১০০০+)"
                  className="text-center text-xl font-bold"
                  onBlur={(e) => updateStatMutation.mutate({ id: stat.id, data: { value: e.target.value } })}
                />
                <Input
                  defaultValue={stat.label_bn}
                  placeholder="লেবেল (বাংলা)"
                  className="text-center"
                  onBlur={(e) => updateStatMutation.mutate({ id: stat.id, data: { label_bn: e.target.value, label: e.target.value } })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// General Settings Editor
function SettingsEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<any>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['website-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (settings?.id) {
        const { error } = await supabase.from('website_settings').update(data).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('website_settings').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-settings'] });
      toast({ title: 'সফল!', description: 'সেটিংস সংরক্ষিত হয়েছে' });
    },
    onError: (err: any) => toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="flex justify-center p-8"><RefreshCw className="animate-spin" /></div>;

  const handleSave = () => {
    saveMutation.mutate({ ...settings, ...formData });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-bangla">সাইটের তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">সাইটের নাম (ইংরেজি)</Label>
              <Input
                defaultValue={settings?.site_name || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, site_name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="font-bangla">সাইটের নাম (বাংলা)</Label>
              <Input
                defaultValue={settings?.site_name_bn || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, site_name_bn: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">ট্যাগলাইন (ইংরেজি)</Label>
              <Input
                defaultValue={settings?.tagline || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, tagline: e.target.value }))}
              />
            </div>
            <div>
              <Label className="font-bangla">ট্যাগলাইন (বাংলা)</Label>
              <Input
                defaultValue={settings?.tagline_bn || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, tagline_bn: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">লোগো URL</Label>
              <Input
                defaultValue={settings?.logo_url || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, logo_url: e.target.value }))}
              />
            </div>
            <div>
              <Label className="font-bangla">ফেভিকন URL</Label>
              <Input
                defaultValue={settings?.favicon_url || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, favicon_url: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bangla">যোগাযোগের তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">ইমেইল</Label>
              <Input
                type="email"
                defaultValue={settings?.contact_email || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, contact_email: e.target.value }))}
              />
            </div>
            <div>
              <Label className="font-bangla">ফোন</Label>
              <Input
                defaultValue={settings?.contact_phone || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, contact_phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label className="font-bangla">ঠিকানা (বাংলা)</Label>
            <Textarea
              defaultValue={settings?.address_bn || ''}
              onChange={(e) => setFormData((p: any) => ({ ...p, address_bn: e.target.value, address: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">অফিস টাইম (বাংলা)</Label>
              <Input
                defaultValue={settings?.office_hours_bn || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, office_hours_bn: e.target.value, office_hours: e.target.value }))}
                placeholder="রবি-বৃহঃ সকাল ৮টা - বিকাল ৪টা"
              />
            </div>
            <div>
              <Label className="font-bangla">ম্যাপ এম্বেড URL</Label>
              <Input
                defaultValue={settings?.map_embed_url || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, map_embed_url: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bangla">সোশ্যাল মিডিয়া</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Facebook URL</Label>
              <Input
                defaultValue={settings?.facebook_url || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, facebook_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>YouTube URL</Label>
              <Input
                defaultValue={settings?.youtube_url || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, youtube_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>Twitter URL</Label>
              <Input
                defaultValue={settings?.twitter_url || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, twitter_url: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-bangla">ফুটার</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">কপিরাইট টেক্সট (ইংরেজি)</Label>
              <Input
                defaultValue={settings?.copyright_text || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, copyright_text: e.target.value }))}
              />
            </div>
            <div>
              <Label className="font-bangla">কপিরাইট টেক্সট (বাংলা)</Label>
              <Input
                defaultValue={settings?.copyright_text_bn || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, copyright_text_bn: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="font-bangla">
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          সব সেটিংস সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}

// About Page Editor
function AboutPageEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const { data: content, isLoading } = useQuery({
    queryKey: ['website-content', 'about'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('page', 'about')
        .eq('section', 'main');
      if (error) throw error;
      return data?.[0];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { page: 'about', section: 'main', ...data };
      const { error } = await supabase.from('website_content').upsert(payload, { onConflict: 'school_id,page,section' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-content', 'about'] });
      toast({ title: 'সফল!', description: 'সংরক্ষিত হয়েছে' });
    },
  });

  if (isLoading) return <div className="flex justify-center p-8"><RefreshCw className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-bangla">আমাদের সম্পর্কে পেজ</CardTitle>
          <CardDescription className="font-bangla">স্কুল সম্পর্কে বিস্তারিত তথ্য</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bangla">শিরোনাম (ইংরেজি)</Label>
              <Input
                defaultValue={content?.title || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label className="font-bangla">শিরোনাম (বাংলা)</Label>
              <Input
                defaultValue={content?.title_bn || ''}
                onChange={(e) => setFormData((p: any) => ({ ...p, title_bn: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label className="font-bangla">বিস্তারিত (বাংলা)</Label>
            <Textarea
              defaultValue={content?.content_bn || ''}
              onChange={(e) => setFormData((p: any) => ({ ...p, content_bn: e.target.value, content: e.target.value }))}
              rows={10}
              placeholder="স্কুলের ইতিহাস, মিশন, ভিশন ইত্যাদি লিখুন..."
            />
          </div>
          <div>
            <Label className="font-bangla">ইমেজ URL</Label>
            <Input
              defaultValue={content?.image_url || ''}
              onChange={(e) => setFormData((p: any) => ({ ...p, image_url: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={content?.is_published ?? true}
              onCheckedChange={(checked) => setFormData((p: any) => ({ ...p, is_published: checked }))}
            />
            <Label className="font-bangla">প্রকাশিত</Label>
          </div>
          <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="font-bangla">
            <Save className="w-4 h-4 mr-2" /> সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Component
export default function WebsiteManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Globe className="w-6 h-6" /> ওয়েবসাইট ম্যানেজমেন্ট
            </h1>
            <p className="text-muted-foreground font-bangla">
              পাবলিক ওয়েবসাইটের সমস্ত কনটেন্ট এখান থেকে পরিচালনা করুন
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer" className="font-bangla">
              <Eye className="w-4 h-4 mr-2" /> ওয়েবসাইট দেখুন
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 h-auto p-2">
            <TabsTrigger value="home" className="font-bangla"><Home className="w-4 h-4 mr-1" /> হোম</TabsTrigger>
            <TabsTrigger value="about" className="font-bangla"><Info className="w-4 h-4 mr-1" /> সম্পর্কে</TabsTrigger>
            <TabsTrigger value="notices" className="font-bangla"><Bell className="w-4 h-4 mr-1" /> নোটিশ</TabsTrigger>
            <TabsTrigger value="teachers" className="font-bangla"><Users className="w-4 h-4 mr-1" /> শিক্ষক</TabsTrigger>
            <TabsTrigger value="gallery" className="font-bangla"><Image className="w-4 h-4 mr-1" /> গ্যালারি</TabsTrigger>
            <TabsTrigger value="settings" className="font-bangla"><Settings className="w-4 h-4 mr-1" /> সেটিংস</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <HomeContentEditor />
          </TabsContent>

          <TabsContent value="about">
            <AboutPageEditor />
          </TabsContent>

          <TabsContent value="notices">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">নোটিশ ম্যানেজমেন্ট</CardTitle>
                <CardDescription className="font-bangla">
                  নোটিশ ম্যানেজমেন্ট পেজ থেকে নোটিশ পরিচালনা করুন
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="font-bangla">
                  <a href="/dashboard/notices">নোটিশ ম্যানেজমেন্ট এ যান</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">শিক্ষক তথ্য</CardTitle>
                <CardDescription className="font-bangla">
                  শিক্ষক ম্যানেজমেন্ট পেজ থেকে শিক্ষকদের তথ্য পরিচালনা করুন
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="font-bangla">
                  <a href="/dashboard/teachers">শিক্ষক ম্যানেজমেন্ট এ যান</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">গ্যালারি ম্যানেজমেন্ট</CardTitle>
                <CardDescription className="font-bangla">
                  গ্যালারি পেজে ছবি যোগ ও পরিচালনা করুন
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-bangla">গ্যালারি পেজে সরাসরি ছবি আপলোড করতে পারবেন।</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <SettingsEditor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
