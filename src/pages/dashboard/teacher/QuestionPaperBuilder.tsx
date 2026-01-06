import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, Reorder } from 'framer-motion';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Eye, Trash2, GripVertical, FileText, Download,
  CheckCircle, HelpCircle, AlignLeft, List, BookOpen, Printer,
  FileDown, Settings, School, Image, Layout
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
  { value: 'creative', label: 'সৃজনশীল পদ্ধতি' },
  { value: 'mcq_only', label: 'শুধু MCQ' },
  { value: 'mixed', label: 'মিশ্র (MCQ + সৃজনশীল)' },
  { value: 'traditional', label: 'প্রচলিত পদ্ধতি' },
];

const questionTypes = [
  { value: 'mcq', label: 'বহুনির্বাচনী', icon: List },
  { value: 'short', label: 'সংক্ষিপ্ত', icon: AlignLeft },
  { value: 'essay', label: 'রচনামূলক', icon: FileText },
  { value: 'fill_blank', label: 'শূন্যস্থান', icon: HelpCircle },
];

interface SelectedQuestion {
  id: string;
  question_text_bn: string;
  question_type: string;
  marks: number;
  options?: any[];
  correct_answer?: string;
  order_index: number;
}

export default function QuestionPaperBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [paper, setPaper] = useState({
    title: '',
    title_bn: '',
    subject: '',
    subject_bn: '',
    class: '',
    exam_pattern: 'mixed',
    total_marks: 100,
    duration_minutes: 180,
    instructions_bn: 'সকল প্রশ্নের উত্তর দিতে হবে।\nডান পাশে প্রশ্নের মান উল্লেখ আছে।',
    use_school_branding: true,
    marks_distribution: {
      mcq: { count: 10, marks_each: 1, total: 10 },
      short: { count: 5, marks_each: 4, total: 20 },
      essay: { count: 5, marks_each: 14, total: 70 },
    },
  });

  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pickerFilters, setPickerFilters] = useState({ type: '', difficulty: '' });

  // Load template from sessionStorage if available
  useEffect(() => {
    const templateData = sessionStorage.getItem('paper_template');
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        const subj = subjects.find(s => s.value === template.subject);
        setPaper(prev => ({
          ...prev,
          title_bn: template.title_bn || prev.title_bn,
          title: template.title_bn || prev.title,
          exam_pattern: template.exam_pattern || prev.exam_pattern,
          subject: template.subject || prev.subject,
          subject_bn: subj?.label || template.subject || prev.subject_bn,
          class: template.class || prev.class,
          total_marks: template.total_marks || prev.total_marks,
          duration_minutes: template.duration_minutes || prev.duration_minutes,
          instructions_bn: template.instructions_bn || prev.instructions_bn,
          marks_distribution: template.marks_distribution || prev.marks_distribution,
        }));
        sessionStorage.removeItem('paper_template');
        toast({ title: 'টেমপ্লেট লোড হয়েছে', description: 'এখন প্রশ্ন যোগ করুন' });
      } catch (e) {
        console.error('Failed to parse template:', e);
      }
    }
  }, []);

  // Fetch school branding
  const { data: schoolBranding } = useQuery({
    queryKey: ['school-branding'],
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
    queryKey: ['school-info'],
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

  // Fetch questions from bank
  const { data: bankQuestions } = useQuery({
    queryKey: ['question-bank-for-picker', paper.subject, paper.class, pickerFilters],
    queryFn: async () => {
      if (!paper.subject || !paper.class) return [];
      let query = supabase
        .from('question_bank')
        .select('*')
        .eq('subject', paper.subject)
        .eq('class', paper.class)
        .eq('is_active', true);
      
      if (pickerFilters.type) query = query.eq('question_type', pickerFilters.type);
      if (pickerFilters.difficulty) query = query.eq('difficulty', pickerFilters.difficulty);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!paper.subject && !!paper.class,
  });

  // Save paper mutation
  const savePaperMutation = useMutation({
    mutationFn: async () => {
      // Create exam paper
      const { data: paperData, error: paperError } = await supabase
        .from('exam_papers')
        .insert([{
          subject: paper.subject,
          subject_bn: paper.subject_bn,
          title: paper.title_bn,
          title_bn: paper.title_bn,
          total_marks: paper.total_marks,
          duration_minutes: paper.duration_minutes,
          instructions_bn: paper.instructions_bn,
          created_by: user?.id,
          status: 'draft',
          use_school_branding: paper.use_school_branding,
          marks_distribution: paper.marks_distribution,
          exam_pattern: paper.exam_pattern,
        }])
        .select()
        .single();
      
      if (paperError) throw paperError;

      // Add questions
      if (selectedQuestions.length > 0) {
        const questionsToInsert = selectedQuestions.map((q, i) => ({
          paper_id: paperData.id,
          question_type: q.question_type,
          question_text: q.question_text_bn,
          question_text_bn: q.question_text_bn,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks,
          order_index: i,
          source_question_id: q.id,
        }));

        const { error: questionsError } = await supabase
          .from('exam_questions')
          .insert(questionsToInsert);
        
        if (questionsError) throw questionsError;
      }

      return paperData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-papers'] });
      toast({ title: 'সফল!', description: 'প্রশ্নপত্র সংরক্ষিত হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const addQuestionFromBank = (question: any) => {
    const exists = selectedQuestions.find(q => q.id === question.id);
    if (exists) {
      toast({ title: 'প্রশ্ন ইতিমধ্যে যোগ করা হয়েছে', variant: 'destructive' });
      return;
    }
    
    setSelectedQuestions([...selectedQuestions, {
      ...question,
      order_index: selectedQuestions.length,
    }]);
    toast({ title: 'প্রশ্ন যোগ হয়েছে' });
  };

  const removeQuestion = (index: number) => {
    setSelectedQuestions(selectedQuestions.filter((_, i) => i !== index));
  };

  const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  const mcqCount = selectedQuestions.filter(q => q.question_type === 'mcq').length;
  const shortCount = selectedQuestions.filter(q => q.question_type === 'short').length;
  const essayCount = selectedQuestions.filter(q => q.question_type === 'essay').length;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${paper.title_bn || 'প্রশ্নপত্র'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
            body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20mm; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .exam-info { font-size: 14px; margin: 5px 0; }
            .instructions { background: #f5f5f5; padding: 10px; margin: 15px 0; border-left: 3px solid #333; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; background: #eee; padding: 5px 10px; }
            .question { margin: 15px 0; page-break-inside: avoid; }
            .question-number { font-weight: bold; }
            .marks { float: right; background: #333; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
            .options { margin-left: 25px; margin-top: 5px; }
            .option { margin: 3px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px; }
            @media print { body { padding: 15mm; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportWord = () => {
    // Generate Word-compatible HTML
    const content = printRef.current?.innerHTML || '';
    const blob = new Blob([`
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset="utf-8"><title>${paper.title_bn}</title></head>
        <body style="font-family: Arial, sans-serif;">${content}</body>
      </html>
    `], { type: 'application/msword' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper.title_bn || 'প্রশ্নপত্র'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Word ফাইল ডাউনলোড হয়েছে' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">প্রশ্নপত্র তৈরি</h1>
            <p className="text-muted-foreground font-bangla">
              প্রশ্ন ব্যাংক থেকে প্রশ্ন নির্বাচন করে প্রশ্নপত্র তৈরি করুন
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowPreview(true)} className="font-bangla">
              <Eye className="w-4 h-4 mr-2" /> প্রিভিউ
            </Button>
            <Button variant="outline" onClick={handlePrint} className="font-bangla">
              <Printer className="w-4 h-4 mr-2" /> প্রিন্ট
            </Button>
            <Button variant="outline" onClick={handleExportWord} className="font-bangla">
              <FileDown className="w-4 h-4 mr-2" /> Word
            </Button>
            <Button 
              onClick={() => savePaperMutation.mutate()} 
              disabled={!paper.subject || selectedQuestions.length === 0}
              className="font-bangla"
            >
              <Save className="w-4 h-4 mr-2" /> সংরক্ষণ
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Paper Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Settings className="w-5 h-5" /> প্রশ্নপত্রের সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-bangla">শিরোনাম</Label>
                <Input
                  value={paper.title_bn}
                  onChange={(e) => setPaper({ ...paper, title_bn: e.target.value, title: e.target.value })}
                  placeholder="যেমন: প্রথম সাময়িক পরীক্ষা"
                  className="font-bangla"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">বিষয়</Label>
                  <Select 
                    value={paper.subject} 
                    onValueChange={(v) => {
                      const subj = subjects.find(s => s.value === v);
                      setPaper({ ...paper, subject: v, subject_bn: subj?.label || v });
                    }}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">শ্রেণী</Label>
                  <Select value={paper.class} onValueChange={(v) => setPaper({ ...paper, class: v })}>
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="font-bangla">পরীক্ষার ধরন</Label>
                <Select value={paper.exam_pattern} onValueChange={(v) => setPaper({ ...paper, exam_pattern: v })}>
                  <SelectTrigger className="font-bangla"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {examPatterns.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">মোট নম্বর</Label>
                  <Input
                    type="number"
                    value={paper.total_marks}
                    onChange={(e) => setPaper({ ...paper, total_marks: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="font-bangla">সময় (মিনিট)</Label>
                  <Input
                    type="number"
                    value={paper.duration_minutes}
                    onChange={(e) => setPaper({ ...paper, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label className="font-bangla">নির্দেশনা</Label>
                <Textarea
                  value={paper.instructions_bn}
                  onChange={(e) => setPaper({ ...paper, instructions_bn: e.target.value })}
                  className="font-bangla"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="branding"
                  checked={paper.use_school_branding}
                  onCheckedChange={(checked) => setPaper({ ...paper, use_school_branding: !!checked })}
                />
                <Label htmlFor="branding" className="font-bangla cursor-pointer">
                  স্কুলের ব্র্যান্ডিং ব্যবহার করুন
                </Label>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm font-bangla">
                  <span>মোট প্রশ্ন:</span>
                  <span className="font-semibold">{selectedQuestions.length} টি</span>
                </div>
                <div className="flex justify-between text-sm font-bangla">
                  <span>MCQ:</span>
                  <span>{mcqCount} টি</span>
                </div>
                <div className="flex justify-between text-sm font-bangla">
                  <span>সংক্ষিপ্ত:</span>
                  <span>{shortCount} টি</span>
                </div>
                <div className="flex justify-between text-sm font-bangla">
                  <span>রচনামূলক:</span>
                  <span>{essayCount} টি</span>
                </div>
                <div className="flex justify-between text-sm font-bangla font-semibold pt-2 border-t">
                  <span>নির্বাচিত নম্বর:</span>
                  <span className={totalMarks === paper.total_marks ? 'text-green-600' : 'text-amber-600'}>
                    {totalMarks}/{paper.total_marks}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Questions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-bangla">নির্বাচিত প্রশ্নসমূহ</CardTitle>
              <Button 
                onClick={() => setShowQuestionPicker(true)} 
                size="sm" 
                className="font-bangla"
                disabled={!paper.subject || !paper.class}
              >
                <Plus className="w-4 h-4 mr-1" /> প্রশ্ন যোগ করুন
              </Button>
            </CardHeader>
            <CardContent>
              {!paper.subject || !paper.class ? (
                <div className="text-center py-12 text-muted-foreground font-bangla">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>প্রথমে বিষয় ও শ্রেণী নির্বাচন করুন</p>
                </div>
              ) : selectedQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-bangla">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>কোনো প্রশ্ন নির্বাচন করা হয়নি</p>
                  <Button 
                    onClick={() => setShowQuestionPicker(true)} 
                    variant="outline" 
                    className="mt-4 font-bangla"
                  >
                    <Plus className="w-4 h-4 mr-1" /> প্রশ্ন ব্যাংক থেকে যোগ করুন
                  </Button>
                </div>
              ) : (
                <Reorder.Group values={selectedQuestions} onReorder={setSelectedQuestions} className="space-y-3">
                  {selectedQuestions.map((q, index) => (
                    <Reorder.Item key={q.id} value={q} className="cursor-move">
                      <motion.div
                        layout
                        className="bg-muted/50 rounded-lg p-4 flex items-start gap-3 group"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-medium font-bangla">প্রশ্ন {index + 1}</span>
                            <Badge variant="secondary" className="font-bangla text-xs">
                              {questionTypes.find(t => t.value === q.question_type)?.label}
                            </Badge>
                            <Badge variant="outline" className="font-bangla text-xs">{q.marks} নম্বর</Badge>
                          </div>
                          <p className="text-sm font-bangla line-clamp-2">{q.question_text_bn}</p>
                          {q.question_type === 'mcq' && q.options && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground font-bangla">
                              {q.options.slice(0, 4).map((opt: any, i: number) => (
                                <span key={i} className={opt.label === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                                  {opt.label}) {opt.text_bn || opt.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          className="opacity-0 group-hover:opacity-100 text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Picker Dialog */}
        <Dialog open={showQuestionPicker} onOpenChange={setShowQuestionPicker}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">প্রশ্ন ব্যাংক থেকে নির্বাচন করুন</DialogTitle>
            </DialogHeader>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap mb-4">
              <div className="w-[150px]">
                <Select 
                  value={pickerFilters.type || 'all'} 
                  onValueChange={(v) => setPickerFilters({ ...pickerFilters, type: v === 'all' ? '' : v })}
                >
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="সব ধরন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব ধরন</SelectItem>
                    {questionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Select 
                  value={pickerFilters.difficulty || 'all'} 
                  onValueChange={(v) => setPickerFilters({ ...pickerFilters, difficulty: v === 'all' ? '' : v })}
                >
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="সব স্তর" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব স্তর</SelectItem>
                    <SelectItem value="easy">সহজ</SelectItem>
                    <SelectItem value="medium">মধ্যম</SelectItem>
                    <SelectItem value="hard">কঠিন</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {bankQuestions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-bangla">
                  এই বিষয় ও শ্রেণীতে কোনো প্রশ্ন পাওয়া যায়নি
                </div>
              ) : (
                bankQuestions?.map((q: any) => {
                  const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                  return (
                    <div 
                      key={q.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => !isSelected && addQuestionFromBank(q)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-bangla">
                              {questionTypes.find(t => t.value === q.question_type)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-bangla">{q.marks} নম্বর</Badge>
                            <Badge variant="outline" className="text-xs font-bangla">
                              {q.difficulty === 'easy' ? 'সহজ' : q.difficulty === 'hard' ? 'কঠিন' : 'মধ্যম'}
                            </Badge>
                          </div>
                          <p className="text-sm font-bangla">{q.question_text_bn}</p>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowQuestionPicker(false)} className="font-bangla">
                সম্পন্ন ({selectedQuestions.length} টি নির্বাচিত)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">প্রশ্নপত্র প্রিভিউ</DialogTitle>
            </DialogHeader>

            <div ref={printRef} className="bg-white p-8 border rounded-lg">
              {/* Header */}
              {paper.use_school_branding && school && (
                <div className="header text-center border-b-2 border-black pb-4 mb-6">
                  {school.logo_url && (
                    <img src={school.logo_url} alt="School Logo" className="h-16 mx-auto mb-2" />
                  )}
                  <h1 className="school-name text-2xl font-bold font-bangla">
                    {school.name_bn || school.name}
                  </h1>
                  {schoolBranding?.header_text_bn && (
                    <p className="text-sm font-bangla">{schoolBranding.header_text_bn}</p>
                  )}
                  <p className="text-sm font-bangla">{school.address}</p>
                </div>
              )}

              {/* Exam Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold font-bangla">{paper.title_bn || 'প্রশ্নপত্র'}</h2>
                <div className="flex justify-center gap-6 mt-2 text-sm font-bangla">
                  <span>বিষয়: {paper.subject_bn}</span>
                  <span>শ্রেণী: {paper.class}</span>
                  <span>পূর্ণমান: {paper.total_marks}</span>
                  <span>সময়: {Math.floor(paper.duration_minutes / 60)} ঘণ্টা {paper.duration_minutes % 60} মিনিট</span>
                </div>
              </div>

              {/* Instructions */}
              {paper.instructions_bn && (
                <div className="instructions bg-muted/50 p-4 rounded-lg mb-6 border-l-4 border-primary">
                  <p className="font-semibold font-bangla mb-2">নির্দেশনা:</p>
                  <p className="whitespace-pre-line text-sm font-bangla">{paper.instructions_bn}</p>
                </div>
              )}

              {/* Questions by Section */}
              {['mcq', 'short', 'essay', 'fill_blank'].map(type => {
                const typeQuestions = selectedQuestions.filter(q => q.question_type === type);
                if (typeQuestions.length === 0) return null;
                
                const typeLabel = questionTypes.find(t => t.value === type)?.label || type;
                
                return (
                  <div key={type} className="section mb-6">
                    <div className="section-title bg-muted p-2 rounded font-bold font-bangla mb-4">
                      {typeLabel} প্রশ্ন
                    </div>
                    <div className="space-y-4">
                      {typeQuestions.map((q, idx) => (
                        <div key={q.id} className="question">
                          <div className="flex justify-between items-start">
                            <p className="font-bangla">
                              <span className="question-number font-bold">{idx + 1}।</span> {q.question_text_bn}
                            </p>
                            <span className="marks bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bangla">
                              {q.marks} নম্বর
                            </span>
                          </div>
                          {type === 'mcq' && q.options && (
                            <div className="options grid grid-cols-2 gap-2 mt-2 ml-6">
                              {q.options.map((opt: any, i: number) => (
                                <div key={i} className="option text-sm font-bangla">
                                  {opt.label}) {opt.text_bn || opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              {paper.use_school_branding && schoolBranding?.footer_text_bn && (
                <div className="footer text-center border-t pt-4 mt-8 text-sm font-bangla text-muted-foreground">
                  {schoolBranding.footer_text_bn}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handlePrint} className="font-bangla">
                <Printer className="w-4 h-4 mr-2" /> প্রিন্ট
              </Button>
              <Button variant="outline" onClick={handleExportWord} className="font-bangla">
                <Download className="w-4 h-4 mr-2" /> Word ডাউনলোড
              </Button>
              <Button onClick={() => setShowPreview(false)} className="font-bangla">
                বন্ধ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
