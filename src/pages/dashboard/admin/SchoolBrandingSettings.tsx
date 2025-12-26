import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Eye, Image, FileText, School } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SchoolBrandingSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [branding, setBranding] = useState({
    header_text: '',
    header_text_bn: '',
    footer_text: '',
    footer_text_bn: '',
    watermark_text: '',
    watermark_text_bn: '',
    show_logo: true,
    logo_position: 'center',
    paper_margin_top: 20,
    paper_margin_bottom: 20,
    paper_margin_left: 15,
    paper_margin_right: 15,
  });

  // Fetch existing branding
  const { data: existingBranding, isLoading } = useQuery({
    queryKey: ['school-branding-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_branding')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch school info
  const { data: school } = useQuery({
    queryKey: ['school-info-for-branding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingBranding) {
      setBranding({
        header_text: existingBranding.header_text || '',
        header_text_bn: existingBranding.header_text_bn || '',
        footer_text: existingBranding.footer_text || '',
        footer_text_bn: existingBranding.footer_text_bn || '',
        watermark_text: existingBranding.watermark_text || '',
        watermark_text_bn: existingBranding.watermark_text_bn || '',
        show_logo: existingBranding.show_logo ?? true,
        logo_position: existingBranding.logo_position || 'center',
        paper_margin_top: existingBranding.paper_margin_top || 20,
        paper_margin_bottom: existingBranding.paper_margin_bottom || 20,
        paper_margin_left: existingBranding.paper_margin_left || 15,
        paper_margin_right: existingBranding.paper_margin_right || 15,
      });
    }
  }, [existingBranding]);

  // Save branding mutation
  const saveBrandingMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...branding,
        school_id: school?.id,
        updated_at: new Date().toISOString(),
      };

      if (existingBranding?.id) {
        const { error } = await supabase
          .from('school_branding')
          .update(payload)
          .eq('id', existingBranding.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('school_branding')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-branding'] });
      toast({ title: 'সফল!', description: 'ব্র্যান্ডিং সেটিংস সংরক্ষিত হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="font-bangla text-muted-foreground">লোড হচ্ছে...</p>
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
            <h1 className="text-2xl font-bold font-bangla">প্রশ্নপত্র ব্র্যান্ডিং</h1>
            <p className="text-muted-foreground font-bangla">
              প্রশ্নপত্রে স্কুলের লোগো, হেডার এবং ফুটার কনফিগার করুন
            </p>
          </div>
          <Button onClick={() => saveBrandingMutation.mutate()} className="font-bangla">
            <Save className="w-4 h-4 mr-2" /> সংরক্ষণ করুন
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-6">
            {/* Header Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <FileText className="w-5 h-5" /> হেডার সেটিংস
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-bangla">হেডার টেক্সট (বাংলা)</Label>
                  <Textarea
                    value={branding.header_text_bn}
                    onChange={(e) => setBranding({ ...branding, header_text_bn: e.target.value })}
                    placeholder="যেমন: শিক্ষা বিভাগ, বাংলাদেশ সরকার"
                    className="font-bangla"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Header Text (English)</Label>
                  <Textarea
                    value={branding.header_text}
                    onChange={(e) => setBranding({ ...branding, header_text: e.target.value })}
                    placeholder="e.g., Education Department, Government of Bangladesh"
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-bangla">লোগো দেখান</Label>
                    <p className="text-xs text-muted-foreground font-bangla">
                      প্রশ্নপত্রে স্কুলের লোগো প্রদর্শন করুন
                    </p>
                  </div>
                  <Switch
                    checked={branding.show_logo}
                    onCheckedChange={(checked) => setBranding({ ...branding, show_logo: checked })}
                  />
                </div>
                {branding.show_logo && (
                  <div>
                    <Label className="font-bangla">লোগো পজিশন</Label>
                    <Select 
                      value={branding.logo_position} 
                      onValueChange={(v) => setBranding({ ...branding, logo_position: v })}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">বামে</SelectItem>
                        <SelectItem value="center">মাঝে</SelectItem>
                        <SelectItem value="right">ডানে</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">ফুটার সেটিংস</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-bangla">ফুটার টেক্সট (বাংলা)</Label>
                  <Textarea
                    value={branding.footer_text_bn}
                    onChange={(e) => setBranding({ ...branding, footer_text_bn: e.target.value })}
                    placeholder="যেমন: পরীক্ষার্থীদের শুভকামনা রইল"
                    className="font-bangla"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Footer Text (English)</Label>
                  <Textarea
                    value={branding.footer_text}
                    onChange={(e) => setBranding({ ...branding, footer_text: e.target.value })}
                    placeholder="e.g., Best wishes to all examinees"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Watermark Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">ওয়াটারমার্ক</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-bangla">ওয়াটারমার্ক টেক্সট (বাংলা)</Label>
                  <Input
                    value={branding.watermark_text_bn}
                    onChange={(e) => setBranding({ ...branding, watermark_text_bn: e.target.value })}
                    placeholder="যেমন: গোপনীয়"
                    className="font-bangla"
                  />
                </div>
                <div>
                  <Label>Watermark Text (English)</Label>
                  <Input
                    value={branding.watermark_text}
                    onChange={(e) => setBranding({ ...branding, watermark_text: e.target.value })}
                    placeholder="e.g., CONFIDENTIAL"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Page Margins */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">পৃষ্ঠার মার্জিন (mm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">উপরে</Label>
                    <Input
                      type="number"
                      value={branding.paper_margin_top}
                      onChange={(e) => setBranding({ ...branding, paper_margin_top: Number(e.target.value) })}
                      min={5}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">নিচে</Label>
                    <Input
                      type="number"
                      value={branding.paper_margin_bottom}
                      onChange={(e) => setBranding({ ...branding, paper_margin_bottom: Number(e.target.value) })}
                      min={5}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">বামে</Label>
                    <Input
                      type="number"
                      value={branding.paper_margin_left}
                      onChange={(e) => setBranding({ ...branding, paper_margin_left: Number(e.target.value) })}
                      min={5}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">ডানে</Label>
                    <Input
                      type="number"
                      value={branding.paper_margin_right}
                      onChange={(e) => setBranding({ ...branding, paper_margin_right: Number(e.target.value) })}
                      min={5}
                      max={50}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Eye className="w-5 h-5" /> প্রিভিউ
                </CardTitle>
                <CardDescription className="font-bangla">
                  প্রশ্নপত্রে কেমন দেখাবে তার নমুনা
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-white border-2 border-dashed p-6 rounded-lg min-h-[500px] relative"
                  style={{
                    paddingTop: `${branding.paper_margin_top}px`,
                    paddingBottom: `${branding.paper_margin_bottom}px`,
                    paddingLeft: `${branding.paper_margin_left}px`,
                    paddingRight: `${branding.paper_margin_right}px`,
                  }}
                >
                  {/* Watermark */}
                  {branding.watermark_text_bn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                      <p className="text-6xl font-bold rotate-[-30deg] font-bangla text-gray-500">
                        {branding.watermark_text_bn}
                      </p>
                    </div>
                  )}

                  {/* Header */}
                  <div className={`text-center border-b-2 border-black pb-4 mb-4 flex flex-col items-${branding.logo_position}`}>
                    {branding.show_logo && school?.logo_url && (
                      <img 
                        src={school.logo_url} 
                        alt="Logo" 
                        className="h-12 mb-2"
                        style={{ alignSelf: branding.logo_position === 'left' ? 'flex-start' : branding.logo_position === 'right' ? 'flex-end' : 'center' }}
                      />
                    )}
                    {branding.show_logo && !school?.logo_url && (
                      <div 
                        className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2"
                        style={{ alignSelf: branding.logo_position === 'left' ? 'flex-start' : branding.logo_position === 'right' ? 'flex-end' : 'center' }}
                      >
                        <School className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <h2 className="text-lg font-bold font-bangla">
                      {school?.name_bn || school?.name || 'বিদ্যালয়ের নাম'}
                    </h2>
                    {branding.header_text_bn && (
                      <p className="text-sm font-bangla text-muted-foreground">{branding.header_text_bn}</p>
                    )}
                    <p className="text-xs font-bangla text-muted-foreground">
                      {school?.address || 'ঠিকানা'}
                    </p>
                  </div>

                  {/* Sample Content */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold font-bangla">প্রথম সাময়িক পরীক্ষা - ২০২৫</h3>
                    <p className="text-sm font-bangla text-muted-foreground">
                      বিষয়: বাংলা | শ্রেণী: ৮ম | পূর্ণমান: ১০০ | সময়: ৩ ঘণ্টা
                    </p>
                  </div>

                  <div className="space-y-3 text-sm font-bangla">
                    <div className="bg-muted/50 p-2 rounded">
                      <p className="font-semibold">নির্দেশনা:</p>
                      <p className="text-xs">১। সকল প্রশ্নের উত্তর দিতে হবে</p>
                    </div>
                    <p className="text-muted-foreground">১। বাংলাদেশের রাজধানী কোথায়? [১ নম্বর]</p>
                    <p className="text-muted-foreground">২। স্বাধীনতা দিবস কবে? [১ নম্বর]</p>
                    <p className="text-muted-foreground">...</p>
                  </div>

                  {/* Footer */}
                  {branding.footer_text_bn && (
                    <div className="absolute bottom-4 left-0 right-0 text-center border-t pt-2">
                      <p className="text-xs font-bangla text-muted-foreground">
                        {branding.footer_text_bn}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
