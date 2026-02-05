import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, Hash, RefreshCw } from 'lucide-react';

export default function StudentIdConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear().toString();

  const [config, setConfig] = useState({
    prefix: '',
    include_year: true,
    year_format: 'YYYY',
    include_class_code: true,
    separator: '-',
    serial_digits: 4,
    academic_year: currentYear,
  });

  // Fetch existing config
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ['student-id-config', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_id_config')
        .select('*')
        .eq('academic_year', currentYear)
        .eq('is_active', true)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        prefix: existingConfig.prefix || '',
        include_year: existingConfig.include_year ?? true,
        year_format: existingConfig.year_format || 'YYYY',
        include_class_code: existingConfig.include_class_code ?? true,
        separator: existingConfig.separator || '-',
        serial_digits: existingConfig.serial_digits || 4,
        academic_year: existingConfig.academic_year || currentYear,
      });
    }
  }, [existingConfig]);

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...config,
        updated_at: new Date().toISOString(),
      };

      if (existingConfig?.id) {
        const { error } = await supabase
          .from('student_id_config')
          .update(payload)
          .eq('id', existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_id_config')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-id-config'] });
      toast({ title: 'সফল!', description: 'স্টুডেন্ট আইডি কনফিগারেশন সংরক্ষিত হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  // Generate preview ID
  const generatePreviewId = () => {
    let id = config.prefix;
    
    if (config.include_year) {
      const yearPart = config.year_format === 'YY' 
        ? currentYear.slice(-2) 
        : currentYear;
      id += yearPart + config.separator;
    }
    
    if (config.include_class_code) {
      id += '05' + config.separator; // Example class code for 5th
    }
    
    id += '0001'.padStart(config.serial_digits, '0');
    
    return id;
  };

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
            <h1 className="text-2xl font-bold font-bangla">স্টুডেন্ট আইডি কনফিগারেশন</h1>
            <p className="text-muted-foreground font-bangla">
              শিক্ষার্থীদের জন্য ইউনিক আইডি ফরম্যাট সেট করুন
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Hash className="w-5 h-5" /> আইডি ফরম্যাট সেটিংস
                </CardTitle>
                <CardDescription className="font-bangla">
                  স্টুডেন্ট আইডি কিভাবে তৈরি হবে তা কনফিগার করুন
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="font-bangla">প্রিফিক্স (ঐচ্ছিক)</Label>
                  <Input
                    value={config.prefix}
                    onChange={(e) => setConfig({ ...config, prefix: e.target.value.toUpperCase() })}
                    placeholder="যেমন: STD, SCH"
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-bangla">
                    আইডির শুরুতে যে টেক্সট থাকবে (সর্বোচ্চ ৫ অক্ষর)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-bangla">বছর অন্তর্ভুক্ত করুন</Label>
                    <p className="text-xs text-muted-foreground font-bangla">
                      আইডিতে ভর্তির বছর থাকবে
                    </p>
                  </div>
                  <Switch
                    checked={config.include_year}
                    onCheckedChange={(checked) => setConfig({ ...config, include_year: checked })}
                  />
                </div>

                {config.include_year && (
                  <div>
                    <Label className="font-bangla">বছরের ফরম্যাট</Label>
                    <Select 
                      value={config.year_format} 
                      onValueChange={(v) => setConfig({ ...config, year_format: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YYYY">পূর্ণ বছর (2025)</SelectItem>
                        <SelectItem value="YY">সংক্ষিপ্ত (25)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-bangla">শ্রেণি কোড অন্তর্ভুক্ত করুন</Label>
                    <p className="text-xs text-muted-foreground font-bangla">
                      আইডিতে শ্রেণির নম্বর থাকবে (01-10)
                    </p>
                  </div>
                  <Switch
                    checked={config.include_class_code}
                    onCheckedChange={(checked) => setConfig({ ...config, include_class_code: checked })}
                  />
                </div>

                <div>
                  <Label className="font-bangla">সেপারেটর</Label>
                  <Select 
                    value={config.separator} 
                    onValueChange={(v) => setConfig({ ...config, separator: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">হাইফেন (-)</SelectItem>
                      <SelectItem value="/">স্ল্যাশ (/)</SelectItem>
                      <SelectItem value="">কোনোটি না</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-bangla">সিরিয়াল নম্বরের সংখ্যা</Label>
                  <Select 
                    value={config.serial_digits.toString()} 
                    onValueChange={(v) => setConfig({ ...config, serial_digits: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">৩ সংখ্যা (001-999)</SelectItem>
                      <SelectItem value="4">৪ সংখ্যা (0001-9999)</SelectItem>
                      <SelectItem value="5">৫ সংখ্যা (00001-99999)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-bangla">শিক্ষাবর্ষ</Label>
                  <Select 
                    value={config.academic_year} 
                    onValueChange={(v) => setConfig({ ...config, academic_year: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">২০২৪</SelectItem>
                      <SelectItem value="2025">২০২৫</SelectItem>
                      <SelectItem value="2026">২০২৬</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            {existingConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla text-lg">বর্তমান পরিসংখ্যান</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{existingConfig.current_serial || 0}</p>
                      <p className="text-sm text-muted-foreground font-bangla">বর্তমান সিরিয়াল</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold font-bangla">{config.academic_year}</p>
                      <p className="text-sm text-muted-foreground font-bangla">শিক্ষাবর্ষ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="font-bangla flex items-center gap-2">
                  <Eye className="w-5 h-5" /> আইডি প্রিভিউ
                </CardTitle>
                <CardDescription className="font-bangla">
                  এই ফরম্যাটে স্টুডেন্ট আইডি তৈরি হবে
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl text-center">
                  <p className="text-4xl font-mono font-bold tracking-wider">
                    {generatePreviewId()}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium font-bangla">ফরম্যাট ব্যাখ্যা:</h4>
                  <div className="space-y-2 text-sm">
                    {config.prefix && (
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="font-bangla">প্রিফিক্স</span>
                        <span className="font-mono font-medium">{config.prefix}</span>
                      </div>
                    )}
                    {config.include_year && (
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="font-bangla">বছর ({config.year_format})</span>
                        <span className="font-mono font-medium">
                          {config.year_format === 'YY' ? currentYear.slice(-2) : currentYear}
                        </span>
                      </div>
                    )}
                    {config.include_class_code && (
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="font-bangla">শ্রেণি কোড</span>
                        <span className="font-mono font-medium">XX</span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="font-bangla">সিরিয়াল ({config.serial_digits} সংখ্যা)</span>
                      <span className="font-mono font-medium">{'0'.repeat(config.serial_digits - 1)}1</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm font-bangla text-yellow-800 dark:text-yellow-200">
                    <strong>নোট:</strong> একবার আইডি তৈরি করা শুরু হলে ফরম্যাট পরিবর্তন করলে 
                    পুরোনো আইডি প্রভাবিত হবে না। শুধুমাত্র নতুন আইডিতে নতুন ফরম্যাট প্রযোজ্য হবে।
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium font-bangla">উদাহরণ আইডি:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded font-mono text-center">
                      {config.prefix}{config.include_year ? (config.year_format === 'YY' ? '25' : '2025') + config.separator : ''}{config.include_class_code ? '01' + config.separator : ''}0001
                    </div>
                    <div className="p-2 bg-muted rounded font-mono text-center">
                      {config.prefix}{config.include_year ? (config.year_format === 'YY' ? '25' : '2025') + config.separator : ''}{config.include_class_code ? '05' + config.separator : ''}0125
                    </div>
                    <div className="p-2 bg-muted rounded font-mono text-center">
                      {config.prefix}{config.include_year ? (config.year_format === 'YY' ? '25' : '2025') + config.separator : ''}{config.include_class_code ? '10' + config.separator : ''}0050
                    </div>
                    <div className="p-2 bg-muted rounded font-mono text-center">
                      {config.prefix}{config.include_year ? (config.year_format === 'YY' ? '25' : '2025') + config.separator : ''}{config.include_class_code ? '08' + config.separator : ''}0999
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
