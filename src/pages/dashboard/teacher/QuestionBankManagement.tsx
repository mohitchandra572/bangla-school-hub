import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Search, Filter, Edit, Trash2, Copy, 
  FileText, HelpCircle, AlignLeft, List, CheckCircle,
  BookOpen, GraduationCap, Layers
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const subjects = [
  { value: 'bangla', label: 'বাংলা', label_bn: 'বাংলা' },
  { value: 'english', label: 'English', label_bn: 'ইংরেজি' },
  { value: 'math', label: 'Mathematics', label_bn: 'গণিত' },
  { value: 'science', label: 'Science', label_bn: 'বিজ্ঞান' },
  { value: 'social', label: 'Social Studies', label_bn: 'সমাজ বিজ্ঞান' },
  { value: 'religion', label: 'Religion', label_bn: 'ধর্ম শিক্ষা' },
  { value: 'ict', label: 'ICT', label_bn: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
];

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];

const questionTypes = [
  { value: 'mcq', label: 'বহুনির্বাচনী (MCQ)', icon: List },
  { value: 'short', label: 'সংক্ষিপ্ত উত্তর', icon: AlignLeft },
  { value: 'essay', label: 'রচনামূলক', icon: FileText },
  { value: 'fill_blank', label: 'শূন্যস্থান পূরণ', icon: HelpCircle },
  { value: 'true_false', label: 'সত্য/মিথ্যা', icon: CheckCircle },
];

const difficulties = [
  { value: 'easy', label: 'সহজ', color: 'bg-green-500' },
  { value: 'medium', label: 'মধ্যম', color: 'bg-yellow-500' },
  { value: 'hard', label: 'কঠিন', color: 'bg-red-500' },
];

interface Question {
  id?: string;
  subject: string;
  subject_bn: string;
  class: string;
  chapter_id?: string;
  question_type: string;
  question_text: string;
  question_text_bn: string;
  options?: { label: string; text: string; text_bn?: string }[];
  correct_answer?: string;
  marks: number;
  difficulty: string;
  difficulty_bn: string;
  tags?: string[];
}

export default function QuestionBankManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    subject: '',
    class: '',
    difficulty: '',
    questionType: '',
    search: '',
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    subject: '',
    subject_bn: '',
    class: '',
    question_type: 'mcq',
    question_text: '',
    question_text_bn: '',
    options: [
      { label: 'ক', text: '', text_bn: '' },
      { label: 'খ', text: '', text_bn: '' },
      { label: 'গ', text: '', text_bn: '' },
      { label: 'ঘ', text: '', text_bn: '' },
    ],
    correct_answer: '',
    marks: 1,
    difficulty: 'medium',
    difficulty_bn: 'মধ্যম',
  });

  // Fetch questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['question-bank', filters],
    queryFn: async () => {
      let query = supabase
        .from('question_bank')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.subject) query = query.eq('subject', filters.subject);
      if (filters.class) query = query.eq('class', filters.class);
      if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
      if (filters.questionType) query = query.eq('question_type', filters.questionType);
      if (filters.search) {
        query = query.or(`question_text_bn.ilike.%${filters.search}%,question_text.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch chapters for dropdown
  const { data: chapters } = useQuery({
    queryKey: ['chapters', currentQuestion.subject, currentQuestion.class],
    queryFn: async () => {
      if (!currentQuestion.subject || !currentQuestion.class) return [];
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject', currentQuestion.subject)
        .eq('class', currentQuestion.class)
        .eq('is_active', true)
        .order('chapter_number');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentQuestion.subject && !!currentQuestion.class,
  });

  // Create/Update question mutation
  const saveQuestionMutation = useMutation({
    mutationFn: async (question: Question) => {
      const payload = {
        ...question,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingQuestion?.id) {
        const { error } = await supabase
          .from('question_bank')
          .update(payload)
          .eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_bank')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      toast({ title: 'সফল!', description: editingQuestion ? 'প্রশ্ন আপডেট হয়েছে' : 'প্রশ্ন যোগ হয়েছে' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_bank')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      toast({ title: 'প্রশ্ন মুছে ফেলা হয়েছে' });
    },
  });

  const resetForm = () => {
    setCurrentQuestion({
      subject: '',
      subject_bn: '',
      class: '',
      question_type: 'mcq',
      question_text: '',
      question_text_bn: '',
      options: [
        { label: 'ক', text: '', text_bn: '' },
        { label: 'খ', text: '', text_bn: '' },
        { label: 'গ', text: '', text_bn: '' },
        { label: 'ঘ', text: '', text_bn: '' },
      ],
      correct_answer: '',
      marks: 1,
      difficulty: 'medium',
      difficulty_bn: 'মধ্যম',
    });
    setEditingQuestion(null);
    setShowAddDialog(false);
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setCurrentQuestion({
      ...question,
      options: question.options || [
        { label: 'ক', text: '', text_bn: '' },
        { label: 'খ', text: '', text_bn: '' },
        { label: 'গ', text: '', text_bn: '' },
        { label: 'ঘ', text: '', text_bn: '' },
      ],
    });
    setShowAddDialog(true);
  };

  const handleDuplicate = (question: any) => {
    setEditingQuestion(null);
    setCurrentQuestion({
      ...question,
      id: undefined,
      options: question.options || [],
    });
    setShowAddDialog(true);
    toast({ title: 'প্রশ্ন কপি করা হয়েছে', description: 'সম্পাদনা করে সংরক্ষণ করুন' });
  };

  const getQuestionTypeIcon = (type: string) => {
    const found = questionTypes.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  const getDifficultyBadge = (difficulty: string) => {
    const found = difficulties.find(d => d.value === difficulty);
    return found ? (
      <Badge variant="outline" className={`${found.color} text-white border-0`}>
        {found.label}
      </Badge>
    ) : null;
  };

  // Stats
  const stats = {
    total: questions?.length || 0,
    mcq: questions?.filter(q => q.question_type === 'mcq').length || 0,
    short: questions?.filter(q => q.question_type === 'short').length || 0,
    essay: questions?.filter(q => q.question_type === 'essay').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">প্রশ্ন ব্যাংক</h1>
            <p className="text-muted-foreground font-bangla">
              প্রশ্ন তৈরি, সম্পাদনা এবং পরিচালনা করুন
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="font-bangla">
            <Plus className="w-4 h-4 mr-2" /> নতুন প্রশ্ন
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground font-bangla">মোট প্রশ্ন</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <List className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.mcq}</p>
                <p className="text-xs text-muted-foreground font-bangla">MCQ</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <AlignLeft className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.short}</p>
                <p className="text-xs text-muted-foreground font-bangla">সংক্ষিপ্ত</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.essay}</p>
                <p className="text-xs text-muted-foreground font-bangla">রচনামূলক</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="font-bangla text-sm">অনুসন্ধান</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="প্রশ্ন খুঁজুন..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9 font-bangla"
                  />
                </div>
              </div>
              <div className="w-[150px]">
                <Label className="font-bangla text-sm">বিষয়</Label>
                <Select value={filters.subject} onValueChange={(v) => setFilters({ ...filters, subject: v === 'all' ? '' : v })}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="সব বিষয়" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব বিষয়</SelectItem>
                    {subjects.map(s => <SelectItem key={s.value} value={s.value}>{s.label_bn}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[120px]">
                <Label className="font-bangla text-sm">শ্রেণী</Label>
                <Select value={filters.class} onValueChange={(v) => setFilters({ ...filters, class: v === 'all' ? '' : v })}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="সব শ্রেণী" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব শ্রেণী</SelectItem>
                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[130px]">
                <Label className="font-bangla text-sm">কঠিনতা</Label>
                <Select value={filters.difficulty} onValueChange={(v) => setFilters({ ...filters, difficulty: v === 'all' ? '' : v })}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="সব স্তর" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব স্তর</SelectItem>
                    {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Label className="font-bangla text-sm">ধরন</Label>
                <Select value={filters.questionType} onValueChange={(v) => setFilters({ ...filters, questionType: v === 'all' ? '' : v })}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="সব ধরন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব ধরন</SelectItem>
                    {questionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ subject: '', class: '', difficulty: '', questionType: '', search: '' })}
                className="font-bangla"
              >
                <Filter className="w-4 h-4 mr-1" /> রিসেট
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">প্রশ্নসমূহ ({questions?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 font-bangla text-muted-foreground">লোড হচ্ছে...</div>
            ) : questions?.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="font-bangla text-muted-foreground">কোনো প্রশ্ন পাওয়া যায়নি</p>
                <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4 font-bangla">
                  <Plus className="w-4 h-4 mr-1" /> নতুন প্রশ্ন যোগ করুন
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {questions?.map((q: any) => {
                  const TypeIcon = getQuestionTypeIcon(q.question_type);
                  return (
                    <div key={q.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="font-bangla">
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {questionTypes.find(t => t.value === q.question_type)?.label}
                            </Badge>
                            <Badge variant="outline" className="font-bangla">{q.subject_bn}</Badge>
                            <Badge variant="outline" className="font-bangla">{q.class} শ্রেণী</Badge>
                            {getDifficultyBadge(q.difficulty)}
                            <span className="text-sm text-muted-foreground font-bangla">{q.marks} নম্বর</span>
                          </div>
                          <p className="font-bangla text-sm">{q.question_text_bn}</p>
                          {q.question_type === 'mcq' && q.options && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground font-bangla">
                              {q.options.map((opt: any, i: number) => (
                                <span key={i} className={opt.label === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                                  {opt.label}) {opt.text_bn || opt.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(q)} title="কপি">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(q)} title="সম্পাদনা">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('এই প্রশ্নটি মুছে ফেলতে চান?')) {
                                deleteQuestionMutation.mutate(q.id);
                              }
                            }}
                            title="মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Question Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">
                {editingQuestion ? 'প্রশ্ন সম্পাদনা' : 'নতুন প্রশ্ন যোগ করুন'}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="bangla" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bangla" className="font-bangla">বাংলা</TabsTrigger>
                <TabsTrigger value="english">English</TabsTrigger>
              </TabsList>

              <div className="space-y-4 mt-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="font-bangla">বিষয় *</Label>
                    <Select 
                      value={currentQuestion.subject} 
                      onValueChange={(v) => {
                        const subj = subjects.find(s => s.value === v);
                        setCurrentQuestion({ 
                          ...currentQuestion, 
                          subject: v, 
                          subject_bn: subj?.label_bn || v 
                        });
                      }}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue placeholder="বিষয় নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s.value} value={s.value}>{s.label_bn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">শ্রেণী *</Label>
                    <Select 
                      value={currentQuestion.class} 
                      onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, class: v })}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue placeholder="শ্রেণী" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">ধরন *</Label>
                    <Select 
                      value={currentQuestion.question_type} 
                      onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, question_type: v })}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2 font-bangla">
                              <t.icon className="w-4 h-4" /> {t.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">কঠিনতা</Label>
                    <Select 
                      value={currentQuestion.difficulty} 
                      onValueChange={(v) => {
                        const diff = difficulties.find(d => d.value === v);
                        setCurrentQuestion({ 
                          ...currentQuestion, 
                          difficulty: v,
                          difficulty_bn: diff?.label || 'মধ্যম'
                        });
                      }}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">অধ্যায়</Label>
                    <Select 
                      value={currentQuestion.chapter_id || ''} 
                      onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, chapter_id: v === 'none' ? undefined : v })}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue placeholder="অধ্যায় নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">কোনো অধ্যায় নেই</SelectItem>
                        {chapters?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.chapter_number}. {c.chapter_name_bn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">নম্বর *</Label>
                    <Input
                      type="number"
                      value={currentQuestion.marks}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: Number(e.target.value) })}
                      min={1}
                    />
                  </div>
                </div>

                {/* Question Text */}
                <TabsContent value="bangla" className="mt-0 space-y-4">
                  <div>
                    <Label className="font-bangla">প্রশ্ন (বাংলা) *</Label>
                    <Textarea
                      value={currentQuestion.question_text_bn}
                      onChange={(e) => setCurrentQuestion({ 
                        ...currentQuestion, 
                        question_text_bn: e.target.value,
                        question_text: currentQuestion.question_text || e.target.value
                      })}
                      placeholder="এখানে প্রশ্ন লিখুন..."
                      className="font-bangla"
                      rows={4}
                    />
                  </div>

                  {currentQuestion.question_type === 'mcq' && (
                    <div className="space-y-3">
                      <Label className="font-bangla">উত্তরের অপশন (বাংলা)</Label>
                      {currentQuestion.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-6 text-center font-bangla font-medium">{opt.label})</span>
                          <Input
                            value={opt.text_bn || opt.text}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[i] = { ...newOptions[i], text_bn: e.target.value, text: e.target.value };
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                            placeholder={`অপশন ${opt.label}`}
                            className="font-bangla flex-1"
                          />
                          <Button
                            type="button"
                            variant={currentQuestion.correct_answer === opt.label ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentQuestion({ ...currentQuestion, correct_answer: opt.label })}
                            title="সঠিক উত্তর"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="english" className="mt-0 space-y-4">
                  <div>
                    <Label>Question (English)</Label>
                    <Textarea
                      value={currentQuestion.question_text}
                      onChange={(e) => setCurrentQuestion({ 
                        ...currentQuestion, 
                        question_text: e.target.value 
                      })}
                      placeholder="Enter question in English..."
                      rows={4}
                    />
                  </div>

                  {currentQuestion.question_type === 'mcq' && (
                    <div className="space-y-3">
                      <Label>Answer Options (English)</Label>
                      {currentQuestion.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-6 text-center font-medium">{opt.label})</span>
                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[i] = { ...newOptions[i], text: e.target.value };
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                            placeholder={`Option ${opt.label}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm} className="font-bangla">
                বাতিল
              </Button>
              <Button 
                onClick={() => saveQuestionMutation.mutate(currentQuestion)}
                disabled={!currentQuestion.question_text_bn || !currentQuestion.subject || !currentQuestion.class}
                className="font-bangla"
              >
                {editingQuestion ? 'আপডেট' : 'সংরক্ষণ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
