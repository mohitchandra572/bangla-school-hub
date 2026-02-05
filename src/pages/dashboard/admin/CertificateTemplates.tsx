import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText, Eye, RefreshCw, User, Award, GraduationCap } from 'lucide-react';

const CERTIFICATE_TYPES = [
  { value: 'transfer_certificate', label: 'Transfer Certificate', label_bn: 'স্থানান্তর সনদ', icon: FileText },
  { value: 'testimonial', label: 'Testimonial', label_bn: 'সাক্ষ্যপত্র', icon: Award },
  { value: 'character_certificate', label: 'Character Certificate', label_bn: 'চরিত্র সনদ', icon: User },
  { value: 'study_certificate', label: 'Study Certificate', label_bn: 'অধ্যয়ন সনদ', icon: GraduationCap },
  { value: 'bonafide_certificate', label: 'Bonafide Certificate', label_bn: 'বোনাফাইড সনদ', icon: FileText },
];

export default function CertificateTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState('transfer_certificate');
  
  const [template, setTemplate] = useState({
    header_text: '',
    header_text_bn: '',
    footer_text: '',
    footer_text_bn: '',
    template_content: '',
    template_content_bn: '',
    show_logo: true,
    show_principal_signature: true,
    show_stamp: true,
    principal_name: '',
    principal_name_bn: '',
    principal_designation: 'প্রধান শিক্ষক',
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Update template when type changes
  useEffect(() => {
    const existingTemplate = templates?.find(t => t.certificate_type === activeType);
    if (existingTemplate) {
      setTemplate({
        header_text: existingTemplate.header_text || '',
        header_text_bn: existingTemplate.header_text_bn || '',
        footer_text: existingTemplate.footer_text || '',
        footer_text_bn: existingTemplate.footer_text_bn || '',
        template_content: existingTemplate.template_content || '',
        template_content_bn: existingTemplate.template_content_bn || '',
        show_logo: existingTemplate.show_logo ?? true,
        show_principal_signature: existingTemplate.show_principal_signature ?? true,
        show_stamp: existingTemplate.show_stamp ?? true,
        principal_name: existingTemplate.principal_name || '',
        principal_name_bn: existingTemplate.principal_name_bn || '',
        principal_designation: existingTemplate.principal_designation || 'প্রধান শিক্ষক',
      });
    } else {
      setTemplate({
        header_text: '',
        header_text_bn: '',
        footer_text: '',
        footer_text_bn: '',
        template_content: getDefaultContent(activeType),
        template_content_bn: getDefaultContentBn(activeType),
        show_logo: true,
        show_principal_signature: true,
        show_stamp: true,
        principal_name: '',
        principal_name_bn: '',
        principal_designation: 'প্রধান শিক্ষক',
      });
    }
  }, [activeType, templates]);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingTemplate = templates?.find(t => t.certificate_type === activeType);
      const typeInfo = CERTIFICATE_TYPES.find(t => t.value === activeType);
      
      const payload = {
        certificate_type: activeType as any,
        name: typeInfo?.label || activeType,
        name_bn: typeInfo?.label_bn || activeType,
        ...template,
        updated_at: new Date().toISOString(),
      };

      if (existingTemplate?.id) {
        const { error } = await supabase
          .from('certificate_templates')
          .update(payload as any)
          .eq('id', existingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('certificate_templates')
          .insert([payload as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast({ title: 'সফল!', description: 'টেমপ্লেট সংরক্ষিত হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const getDefaultContent = (type: string) => {
    const contents: Record<string, string> = {
      transfer_certificate: 'This is to certify that {{student_name}} was a student of this school.',
      testimonial: 'This is to certify that {{student_name}} was a student of this institution.',
      character_certificate: 'This is to certify that {{student_name}} is of good moral character.',
      study_certificate: 'This is to certify that {{student_name}} is currently studying in this school.',
      bonafide_certificate: 'This is to certify that {{student_name}} is a bonafide student of this school.',
    };
    return contents[type] || '';
  };

  const getDefaultContentBn = (type: string) => {
    const contents: Record<string, string> = {
      transfer_certificate: 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {{student_name}} এই বিদ্যালয়ের ছাত্র/ছাত্রী ছিল।',
      testimonial: 'এই মর্মে সাক্ষ্য দেওয়া যাচ্ছে যে, {{student_name}} এই প্রতিষ্ঠানের ছাত্র/ছাত্রী ছিল।',
      character_certificate: 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {{student_name}} এর চরিত্র ও আচার-আচরণ সন্তোষজনক।',
      study_certificate: 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {{student_name}} বর্তমানে এই বিদ্যালয়ে অধ্যয়নরত।',
      bonafide_certificate: 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {{student_name}} এই বিদ্যালয়ের একজন বোনাফাইড ছাত্র/ছাত্রী।',
    };
    return contents[type] || '';
  };

  const currentTypeInfo = CERTIFICATE_TYPES.find(t => t.value === activeType);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
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
            <h1 className="text-2xl font-bold font-bangla">সার্টিফিকেট টেমপ্লেট</h1>
            <p className="text-muted-foreground font-bangla">
              বিভিন্ন ধরনের সার্টিফিকেটের টেমপ্লেট কনফিগার করুন
            </p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            className="font-bangla"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            সংরক্ষণ করুন
          </Button>
        </div>

        {/* Certificate Type Tabs */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="grid grid-cols-5 w-full">
            {CERTIFICATE_TYPES.map((type) => (
              <TabsTrigger 
                key={type.value} 
                value={type.value}
                className="font-bangla text-xs md:text-sm"
              >
                <type.icon className="w-4 h-4 mr-1 hidden md:inline" />
                {type.label_bn}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeType} className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Settings */}
              <div className="space-y-6">
                {/* Header/Footer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-bangla">হেডার ও ফুটার</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-bangla">হেডার টেক্সট (বাংলা)</Label>
                      <Input
                        value={template.header_text_bn}
                        onChange={(e) => setTemplate({ ...template, header_text_bn: e.target.value })}
                        placeholder="যেমন: গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
                        className="font-bangla"
                      />
                    </div>
                    <div>
                      <Label>Header Text (English)</Label>
                      <Input
                        value={template.header_text}
                        onChange={(e) => setTemplate({ ...template, header_text: e.target.value })}
                        placeholder="e.g., Government of the People's Republic of Bangladesh"
                      />
                    </div>
                    <div>
                      <Label className="font-bangla">ফুটার টেক্সট (বাংলা)</Label>
                      <Input
                        value={template.footer_text_bn}
                        onChange={(e) => setTemplate({ ...template, footer_text_bn: e.target.value })}
                        placeholder="যেমন: এই সনদপত্র কম্পিউটারে তৈরি করা হয়েছে"
                        className="font-bangla"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Content Template */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-bangla">সার্টিফিকেট কন্টেন্ট</CardTitle>
                    <CardDescription className="font-bangla">
                      ভেরিয়েবল ব্যবহার করুন: {'{{student_name}}'}, {'{{father_name}}'}, {'{{class}}'}, {'{{roll}}'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-bangla">মূল টেক্সট (বাংলা)</Label>
                      <Textarea
                        value={template.template_content_bn}
                        onChange={(e) => setTemplate({ ...template, template_content_bn: e.target.value })}
                        rows={6}
                        className="font-bangla"
                      />
                    </div>
                    <div>
                      <Label>Content (English)</Label>
                      <Textarea
                        value={template.template_content}
                        onChange={(e) => setTemplate({ ...template, template_content: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Signature Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-bangla">স্বাক্ষর সেটিংস</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-bangla">লোগো দেখান</Label>
                      </div>
                      <Switch
                        checked={template.show_logo}
                        onCheckedChange={(checked) => setTemplate({ ...template, show_logo: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-bangla">প্রধান শিক্ষকের স্বাক্ষর</Label>
                      </div>
                      <Switch
                        checked={template.show_principal_signature}
                        onCheckedChange={(checked) => setTemplate({ ...template, show_principal_signature: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-bangla">সীল/মোহর</Label>
                      </div>
                      <Switch
                        checked={template.show_stamp}
                        onCheckedChange={(checked) => setTemplate({ ...template, show_stamp: checked })}
                      />
                    </div>
                    <div>
                      <Label className="font-bangla">প্রধান শিক্ষকের নাম (বাংলা)</Label>
                      <Input
                        value={template.principal_name_bn}
                        onChange={(e) => setTemplate({ ...template, principal_name_bn: e.target.value })}
                        className="font-bangla"
                      />
                    </div>
                    <div>
                      <Label className="font-bangla">পদবী</Label>
                      <Input
                        value={template.principal_designation}
                        onChange={(e) => setTemplate({ ...template, principal_designation: e.target.value })}
                        className="font-bangla"
                      />
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
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border-2 border-dashed p-6 rounded-lg min-h-[600px] relative">
                      {/* Header */}
                      <div className="text-center border-b-2 border-black pb-4 mb-4">
                        {template.show_logo && (
                          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {template.header_text_bn && (
                          <p className="text-sm font-bangla text-muted-foreground">{template.header_text_bn}</p>
                        )}
                        <h2 className="text-xl font-bold font-bangla">বিদ্যালয়ের নাম</h2>
                        <p className="text-sm text-muted-foreground">ঠিকানা</p>
                      </div>

                      {/* Title */}
                      <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold font-bangla underline">
                          {currentTypeInfo?.label_bn}
                        </h1>
                        <p className="text-sm">Certificate No: TC-2025-00001</p>
                      </div>

                      {/* Content */}
                      <div className="font-bangla mb-8 text-sm leading-relaxed">
                        {template.template_content_bn.split('{{').map((part, i) => {
                          if (i === 0) return part;
                          const [varName, rest] = part.split('}}');
                          return (
                            <span key={i}>
                              <strong className="text-primary">[{varName}]</strong>
                              {rest}
                            </span>
                          );
                        })}
                      </div>

                      {/* Signature */}
                      <div className="absolute bottom-6 right-6 text-center">
                        {template.show_principal_signature && (
                          <>
                            <div className="border-t border-black pt-2 px-8">
                              <p className="font-bangla">{template.principal_name_bn || '[প্রধান শিক্ষকের নাম]'}</p>
                              <p className="text-sm text-muted-foreground font-bangla">
                                {template.principal_designation}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer */}
                      {template.footer_text_bn && (
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <p className="text-xs text-muted-foreground font-bangla">
                            {template.footer_text_bn}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
