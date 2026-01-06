import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, FileText, Copy, Edit2, Trash2, Clock, Award,
  BookOpen, Layout, Star, Users, Lock, Globe, Search,
  Filter, ChevronRight
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const subjects = [
  { value: 'bangla', label: 'বাংলা' },
  { value: 'english', label: 'ইংরেজি' },
  { value: 'math', label: 'গণিত' },
  { value: 'science', label: 'বিজ্ঞান' },
  { value: 'social', label: 'সমাজ বিজ্ঞান' },
  { value: 'religion', label: 'ধর্ম শিক্ষা' },
  { value: 'ict', label: 'তথ্য প্রযুক্তি' },
];

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];

const examPatterns = [
  { value: 'creative', label: 'সৃজনশীল পদ্ধতি', icon: '🎨' },
  { value: 'mcq_only', label: 'শুধু MCQ', icon: '☑️' },
  { value: 'mixed', label: 'মিশ্র পদ্ধতি', icon: '📝' },
  { value: 'traditional', label: 'প্রচলিত পদ্ধতি', icon: '📜' },
];

interface Template {
  id: string;
  name: string;
  name_bn: string;
  description: string | null;
  description_bn: string | null;
  exam_pattern: string;
  subject: string | null;
  subject_bn: string | null;
  class: string | null;
  total_marks: number;
  duration_minutes: number;
  instructions_bn: string | null;
  marks_distribution: any;
  question_structure: any;
  is_system_template: boolean;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export default function QuestionPaperTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPattern, setFilterPattern] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTab, setSelectedTab] = useState('system');

  const [newTemplate, setNewTemplate] = useState({
    name_bn: '',
    description_bn: '',
    exam_pattern: 'mixed',
    subject: '',
    class: '',
    total_marks: 100,
    duration_minutes: 180,
    instructions_bn: 'সকল প্রশ্নের উত্তর দিতে হবে।\nপ্রতিটি প্রশ্নের মান ডান পাশে উল্লেখ আছে।',
    marks_distribution: {
      mcq: { count: 10, marks_each: 1, total: 10 },
      short: { count: 5, marks_each: 4, total: 20 },
      essay: { count: 5, marks_each: 14, total: 70 },
    },
    question_structure: [
      { type: 'mcq', section_bn: 'ক বিভাগ - বহুনির্বাচনী', count: 10, marks_each: 1, instructions_bn: 'সঠিক উত্তর বেছে নাও' },
      { type: 'short', section_bn: 'খ বিভাগ - সংক্ষিপ্ত প্রশ্ন', count: 5, marks_each: 4, instructions_bn: 'সংক্ষেপে উত্তর দাও' },
      { type: 'essay', section_bn: 'গ বিভাগ - রচনামূলক', count: 5, marks_each: 14, instructions_bn: 'বিস্তারিত উত্তর দাও' },
    ],
    is_public: false,
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['question-paper-templates', filterPattern],
    queryFn: async () => {
      let query = supabase
        .from('question_paper_templates')
        .select('*')
        .order('is_system_template', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterPattern !== 'all') {
        query = query.eq('exam_pattern', filterPattern);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const subjectLabel = subjects.find(s => s.value === template.subject)?.label || template.subject;
      const { data, error } = await supabase
        .from('question_paper_templates')
        .insert([{
          name: template.name_bn,
          name_bn: template.name_bn,
          description_bn: template.description_bn,
          exam_pattern: template.exam_pattern,
          subject: template.subject || null,
          subject_bn: subjectLabel || null,
          class: template.class || null,
          total_marks: template.total_marks,
          duration_minutes: template.duration_minutes,
          instructions_bn: template.instructions_bn,
          marks_distribution: template.marks_distribution,
          question_structure: template.question_structure,
          is_public: template.is_public,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-paper-templates'] });
      toast({ title: 'সফল!', description: 'টেমপ্লেট তৈরি হয়েছে' });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: { id: string } & typeof newTemplate) => {
      const subjectLabel = subjects.find(s => s.value === template.subject)?.label || template.subject;
      const { data, error } = await supabase
        .from('question_paper_templates')
        .update({
          name: template.name_bn,
          name_bn: template.name_bn,
          description_bn: template.description_bn,
          exam_pattern: template.exam_pattern,
          subject: template.subject || null,
          subject_bn: subjectLabel || null,
          class: template.class || null,
          total_marks: template.total_marks,
          duration_minutes: template.duration_minutes,
          instructions_bn: template.instructions_bn,
          marks_distribution: template.marks_distribution,
          question_structure: template.question_structure,
          is_public: template.is_public,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-paper-templates'] });
      toast({ title: 'সফল!', description: 'টেমপ্লেট আপডেট হয়েছে' });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_paper_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-paper-templates'] });
      toast({ title: 'সফল!', description: 'টেমপ্লেট মুছে ফেলা হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setNewTemplate({
      name_bn: '',
      description_bn: '',
      exam_pattern: 'mixed',
      subject: '',
      class: '',
      total_marks: 100,
      duration_minutes: 180,
      instructions_bn: 'সকল প্রশ্নের উত্তর দিতে হবে।\nপ্রতিটি প্রশ্নের মান ডান পাশে উল্লেখ আছে।',
      marks_distribution: {
        mcq: { count: 10, marks_each: 1, total: 10 },
        short: { count: 5, marks_each: 4, total: 20 },
        essay: { count: 5, marks_each: 14, total: 70 },
      },
      question_structure: [
        { type: 'mcq', section_bn: 'ক বিভাগ - বহুনির্বাচনী', count: 10, marks_each: 1, instructions_bn: 'সঠিক উত্তর বেছে নাও' },
        { type: 'short', section_bn: 'খ বিভাগ - সংক্ষিপ্ত প্রশ্ন', count: 5, marks_each: 4, instructions_bn: 'সংক্ষেপে উত্তর দাও' },
        { type: 'essay', section_bn: 'গ বিভাগ - রচনামূলক', count: 5, marks_each: 14, instructions_bn: 'বিস্তারিত উত্তর দাও' },
      ],
      is_public: false,
    });
  };

  const useTemplate = (template: Template) => {
    // Navigate to paper builder with template data
    const templateData = {
      title_bn: template.name_bn,
      exam_pattern: template.exam_pattern,
      subject: template.subject || '',
      class: template.class || '',
      total_marks: template.total_marks,
      duration_minutes: template.duration_minutes,
      instructions_bn: template.instructions_bn || '',
      marks_distribution: template.marks_distribution,
    };
    
    // Store in sessionStorage and navigate
    sessionStorage.setItem('paper_template', JSON.stringify(templateData));
    navigate('/dashboard/teacher/question-paper');
    toast({ title: 'টেমপ্লেট লোড হয়েছে', description: 'এখন প্রশ্ন যোগ করুন' });
  };

  const filteredTemplates = templates?.filter(t => {
    if (searchQuery) {
      return t.name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
             t.description_bn?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const systemTemplates = filteredTemplates?.filter(t => t.is_system_template);
  const myTemplates = filteredTemplates?.filter(t => !t.is_system_template && t.created_by === user?.id);
  const publicTemplates = filteredTemplates?.filter(t => !t.is_system_template && t.is_public && t.created_by !== user?.id);

  const getPatternIcon = (pattern: string) => {
    return examPatterns.find(p => p.value === pattern)?.icon || '📄';
  };

  const getPatternLabel = (pattern: string) => {
    return examPatterns.find(p => p.value === pattern)?.label || pattern;
  };

  const TemplateCard = ({ template }: { template: Template }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getPatternIcon(template.exam_pattern)}</span>
              <div>
                <CardTitle className="text-lg font-bangla group-hover:text-primary transition-colors">
                  {template.name_bn}
                </CardTitle>
                <CardDescription className="font-bangla text-xs mt-1">
                  {getPatternLabel(template.exam_pattern)}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              {template.is_system_template && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" /> সিস্টেম
                </Badge>
              )}
              {template.is_public && !template.is_system_template && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" /> পাবলিক
                </Badge>
              )}
              {!template.is_public && !template.is_system_template && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" /> প্রাইভেট
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {template.description_bn && (
            <p className="text-sm text-muted-foreground font-bangla mb-3 line-clamp-2">
              {template.description_bn}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-bangla">
              <Award className="w-3 h-3 mr-1" /> {template.total_marks} নম্বর
            </Badge>
            <Badge variant="outline" className="font-bangla">
              <Clock className="w-3 h-3 mr-1" /> {template.duration_minutes} মিনিট
            </Badge>
            {template.subject_bn && (
              <Badge variant="outline" className="font-bangla">
                <BookOpen className="w-3 h-3 mr-1" /> {template.subject_bn}
              </Badge>
            )}
            {template.class && (
              <Badge variant="outline" className="font-bangla">
                {template.class} শ্রেণী
              </Badge>
            )}
          </div>
          
          {/* Question Structure Preview */}
          {template.question_structure && Array.isArray(template.question_structure) && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground font-bangla mb-2">প্রশ্নের গঠন:</p>
              <div className="flex flex-wrap gap-1">
                {template.question_structure.slice(0, 3).map((section: any, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs font-bangla">
                    {section.type === 'mcq' ? 'MCQ' : section.type === 'short' ? 'সংক্ষিপ্ত' : section.type === 'essay' ? 'রচনামূলক' : section.type}: {section.count}টি
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 gap-2">
          <Button 
            onClick={() => useTemplate(template)} 
            className="flex-1 font-bangla"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" /> ব্যবহার করুন
          </Button>
          {!template.is_system_template && template.created_by === user?.id && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingTemplate(template);
                  setNewTemplate({
                    name_bn: template.name_bn,
                    description_bn: template.description_bn || '',
                    exam_pattern: template.exam_pattern,
                    subject: template.subject || '',
                    class: template.class || '',
                    total_marks: template.total_marks,
                    duration_minutes: template.duration_minutes,
                    instructions_bn: template.instructions_bn || '',
                    marks_distribution: template.marks_distribution || {},
                    question_structure: template.question_structure || [],
                    is_public: template.is_public,
                  });
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => {
                  if (confirm('টেমপ্লেট মুছে ফেলতে চান?')) {
                    deleteTemplateMutation.mutate(template.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">প্রশ্নপত্র টেমপ্লেট</h1>
            <p className="text-muted-foreground font-bangla">
              পূর্বনির্ধারিত টেমপ্লেট ব্যবহার করে দ্রুত প্রশ্নপত্র তৈরি করুন
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="font-bangla">
            <Plus className="w-4 h-4 mr-2" /> নতুন টেমপ্লেট
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="টেমপ্লেট খুঁজুন..."
                  className="pl-10 font-bangla"
                />
              </div>
              <Select value={filterPattern} onValueChange={setFilterPattern}>
                <SelectTrigger className="w-full md:w-48 font-bangla">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="পরীক্ষার ধরন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সকল ধরন</SelectItem>
                  {examPatterns.map(p => (
                    <SelectItem key={p.value} value={p.value} className="font-bangla">
                      {p.icon} {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 font-bangla">
            <TabsTrigger value="system" className="font-bangla">
              <Star className="w-4 h-4 mr-2" /> সিস্টেম ({systemTemplates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="my" className="font-bangla">
              <Layout className="w-4 h-4 mr-2" /> আমার ({myTemplates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="public" className="font-bangla">
              <Users className="w-4 h-4 mr-2" /> পাবলিক ({publicTemplates?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))}
              </div>
            ) : systemTemplates?.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-bangla text-muted-foreground">কোনো সিস্টেম টেমপ্লেট পাওয়া যায়নি</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemTemplates?.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="mt-6">
            {myTemplates?.length === 0 ? (
              <Card className="p-8 text-center">
                <Layout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-bangla text-muted-foreground mb-4">আপনার কোনো টেমপ্লেট নেই</p>
                <Button onClick={() => setShowCreateDialog(true)} className="font-bangla">
                  <Plus className="w-4 h-4 mr-2" /> প্রথম টেমপ্লেট তৈরি করুন
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTemplates?.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public" className="mt-6">
            {publicTemplates?.length === 0 ? (
              <Card className="p-8 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-bangla text-muted-foreground">কোনো পাবলিক টেমপ্লেট পাওয়া যায়নি</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTemplates?.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Template Dialog */}
        <Dialog open={showCreateDialog || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">
                {editingTemplate ? 'টেমপ্লেট সম্পাদনা' : 'নতুন টেমপ্লেট তৈরি'}
              </DialogTitle>
              <DialogDescription className="font-bangla">
                প্রশ্নপত্রের জন্য একটি পুনঃব্যবহারযোগ্য টেমপ্লেট তৈরি করুন
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="font-bangla">টেমপ্লেটের নাম</Label>
                <Input
                  value={newTemplate.name_bn}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name_bn: e.target.value })}
                  placeholder="যেমন: অর্ধ-বার্ষিক পরীক্ষা"
                  className="font-bangla"
                />
              </div>

              <div>
                <Label className="font-bangla">বিবরণ</Label>
                <Textarea
                  value={newTemplate.description_bn}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description_bn: e.target.value })}
                  placeholder="টেমপ্লেটের সংক্ষিপ্ত বিবরণ"
                  className="font-bangla"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">পরীক্ষার ধরন</Label>
                  <Select 
                    value={newTemplate.exam_pattern} 
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, exam_pattern: v })}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {examPatterns.map(p => (
                        <SelectItem key={p.value} value={p.value} className="font-bangla">
                          {p.icon} {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">বিষয় (ঐচ্ছিক)</Label>
                  <Select 
                    value={newTemplate.subject} 
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, subject: v })}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="সকল বিষয়" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="font-bangla">সকল বিষয়</SelectItem>
                      {subjects.map(s => (
                        <SelectItem key={s.value} value={s.value} className="font-bangla">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-bangla">শ্রেণী (ঐচ্ছিক)</Label>
                  <Select 
                    value={newTemplate.class} 
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, class: v })}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="সকল শ্রেণী" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="font-bangla">সকল শ্রেণী</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c} value={c} className="font-bangla">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">মোট নম্বর</Label>
                  <Input
                    type="number"
                    value={newTemplate.total_marks}
                    onChange={(e) => setNewTemplate({ ...newTemplate, total_marks: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="font-bangla">সময় (মিনিট)</Label>
                  <Input
                    type="number"
                    value={newTemplate.duration_minutes}
                    onChange={(e) => setNewTemplate({ ...newTemplate, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label className="font-bangla">নির্দেশনা</Label>
                <Textarea
                  value={newTemplate.instructions_bn}
                  onChange={(e) => setNewTemplate({ ...newTemplate, instructions_bn: e.target.value })}
                  className="font-bangla"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  id="public"
                  checked={newTemplate.is_public}
                  onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, is_public: !!checked })}
                />
                <Label htmlFor="public" className="font-bangla cursor-pointer">
                  অন্যান্য শিক্ষকদের সাথে শেয়ার করুন (পাবলিক)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="font-bangla"
              >
                বাতিল
              </Button>
              <Button 
                onClick={() => {
                  if (!newTemplate.name_bn) {
                    toast({ title: 'নাম আবশ্যক', variant: 'destructive' });
                    return;
                  }
                  if (editingTemplate) {
                    updateTemplateMutation.mutate({ id: editingTemplate.id, ...newTemplate });
                  } else {
                    createTemplateMutation.mutate(newTemplate);
                  }
                }}
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                className="font-bangla"
              >
                {editingTemplate ? 'আপডেট করুন' : 'তৈরি করুন'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}