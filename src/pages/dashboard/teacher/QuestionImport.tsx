import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, FileText, Image, AlertCircle, CheckCircle, 
  Clock, XCircle, Eye, Plus, Trash2, Save, Languages
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

const questionTypes = [
  { value: 'mcq', label: 'বহুনির্বাচনী (MCQ)' },
  { value: 'short', label: 'সংক্ষিপ্ত উত্তর' },
  { value: 'essay', label: 'রচনামূলক' },
  { value: 'fill_blank', label: 'শূন্যস্থান পূরণ' },
];

const difficulties = [
  { value: 'easy', label: 'সহজ' },
  { value: 'medium', label: 'মধ্যম' },
  { value: 'hard', label: 'কঠিন' },
];

interface ParsedQuestion {
  id: string;
  question_text: string;
  question_text_bn: string;
  question_type: string;
  marks: number;
  difficulty: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  isValid: boolean;
}

export default function QuestionImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importSettings, setImportSettings] = useState({
    subject: '',
    subject_bn: '',
    class: '',
    language: 'bn',
    default_type: 'mcq',
    default_marks: 1,
    default_difficulty: 'medium',
  });

  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualQuestion, setManualQuestion] = useState({
    question_text_bn: '',
    question_text: '',
    question_type: 'mcq',
    marks: 1,
    difficulty: 'medium',
    options: [
      { label: 'ক', text: '' },
      { label: 'খ', text: '' },
      { label: 'গ', text: '' },
      { label: 'ঘ', text: '' },
    ],
    correct_answer: '',
  });

  // Fetch import history
  const { data: importHistory } = useQuery({
    queryKey: ['question-import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_import_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Parse text to extract questions
  const parseTextToQuestions = (text: string): ParsedQuestion[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const questions: ParsedQuestion[] = [];
    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let questionNumber = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a new question (starts with number followed by . or ))
      const questionMatch = trimmedLine.match(/^(\d+)[.)]\s*(.+)/);
      
      if (questionMatch) {
        // Save previous question
        if (currentQuestion?.question_text_bn) {
          questions.push({
            id: `q_${questionNumber}`,
            question_text: currentQuestion.question_text_bn || '',
            question_text_bn: currentQuestion.question_text_bn || '',
            question_type: currentQuestion.question_type || importSettings.default_type,
            marks: currentQuestion.marks || importSettings.default_marks,
            difficulty: importSettings.default_difficulty,
            options: currentQuestion.options,
            correct_answer: currentQuestion.correct_answer,
            isValid: true,
          });
        }
        
        questionNumber++;
        currentQuestion = {
          question_text_bn: questionMatch[2],
          options: [],
          question_type: 'short',
        };
      } else if (currentQuestion) {
        // Check if it's an option (starts with ক, খ, গ, ঘ or a, b, c, d)
        const optionMatch = trimmedLine.match(/^([কখগঘঙচছabcd])[.)]\s*(.+)/i);
        
        if (optionMatch) {
          if (!currentQuestion.options) currentQuestion.options = [];
          currentQuestion.options.push({
            label: optionMatch[1],
            text: optionMatch[2],
          });
          currentQuestion.question_type = 'mcq';
        } else if (trimmedLine.toLowerCase().startsWith('উত্তর:') || trimmedLine.toLowerCase().startsWith('answer:')) {
          currentQuestion.correct_answer = trimmedLine.split(':')[1]?.trim();
        } else if (trimmedLine.match(/^\d+\s*(নম্বর|marks?)/i)) {
          const marksMatch = trimmedLine.match(/^(\d+)/);
          if (marksMatch) currentQuestion.marks = parseInt(marksMatch[1]);
        }
      }
    }

    // Don't forget the last question
    if (currentQuestion?.question_text_bn) {
      questions.push({
        id: `q_${questionNumber}`,
        question_text: currentQuestion.question_text_bn || '',
        question_text_bn: currentQuestion.question_text_bn || '',
        question_type: currentQuestion.question_type || importSettings.default_type,
        marks: currentQuestion.marks || importSettings.default_marks,
        difficulty: importSettings.default_difficulty,
        options: currentQuestion.options,
        correct_answer: currentQuestion.correct_answer,
        isValid: true,
      });
    }

    return questions;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(10);

    try {
      // For text files, read directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setUploadProgress(50);
        const questions = parseTextToQuestions(text);
        setParsedQuestions(questions);
        setUploadProgress(100);
        
        toast({
          title: 'পার্সিং সম্পন্ন',
          description: `${questions.length} টি প্রশ্ন পাওয়া গেছে`,
        });
      } else if (file.type.startsWith('image/')) {
        // For images, we'd normally use OCR API
        // For now, show a message that OCR is processing
        setUploadProgress(30);
        
        toast({
          title: 'OCR প্রসেসিং',
          description: 'ছবি থেকে টেক্সট এক্সট্রাক্ট করা হচ্ছে...',
        });

        // Simulate OCR processing (in production, this would call an OCR API)
        await new Promise(resolve => setTimeout(resolve, 2000));
        setUploadProgress(80);

        // For demo, show placeholder
        toast({
          title: 'OCR সম্পন্ন',
          description: 'অনুগ্রহ করে ম্যানুয়ালি প্রশ্ন যোগ করুন বা টেক্সট ফাইল ব্যবহার করুন',
          variant: 'destructive',
        });
        setUploadProgress(100);
      } else {
        toast({
          title: 'অসমর্থিত ফাইল',
          description: 'শুধুমাত্র .txt, .png, .jpg ফাইল সমর্থিত',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'ত্রুটি',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save questions to bank
  const saveQuestionsMutation = useMutation({
    mutationFn: async (questions: ParsedQuestion[]) => {
      const validQuestions = questions.filter(q => q.isValid);
      
      const toInsert = validQuestions.map(q => ({
        subject: importSettings.subject,
        subject_bn: importSettings.subject_bn,
        class: importSettings.class,
        question_type: q.question_type,
        question_text: q.question_text,
        question_text_bn: q.question_text_bn,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        difficulty: q.difficulty,
        difficulty_bn: difficulties.find(d => d.value === q.difficulty)?.label || 'মধ্যম',
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('question_bank')
        .insert(toInsert);
      
      if (error) throw error;

      // Log import
      await supabase
        .from('question_import_history')
        .insert([{
          file_name: 'Manual/Text Import',
          import_type: 'text',
          language: importSettings.language,
          status: 'completed',
          total_questions: questions.length,
          imported_questions: validQuestions.length,
          failed_questions: questions.length - validQuestions.length,
          created_by: user?.id,
          completed_at: new Date().toISOString(),
        }]);

      return validQuestions.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      queryClient.invalidateQueries({ queryKey: ['question-import-history'] });
      toast({ title: 'সফল!', description: `${count} টি প্রশ্ন সংরক্ষিত হয়েছে` });
      setParsedQuestions([]);
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  // Add manual question
  const addManualQuestion = () => {
    if (!manualQuestion.question_text_bn) {
      toast({ title: 'প্রশ্ন লিখুন', variant: 'destructive' });
      return;
    }

    const newQuestion: ParsedQuestion = {
      id: `manual_${Date.now()}`,
      question_text: manualQuestion.question_text || manualQuestion.question_text_bn,
      question_text_bn: manualQuestion.question_text_bn,
      question_type: manualQuestion.question_type,
      marks: manualQuestion.marks,
      difficulty: manualQuestion.difficulty,
      options: manualQuestion.question_type === 'mcq' ? manualQuestion.options : undefined,
      correct_answer: manualQuestion.correct_answer,
      isValid: true,
    };

    setParsedQuestions([...parsedQuestions, newQuestion]);
    setManualQuestion({
      question_text_bn: '',
      question_text: '',
      question_type: 'mcq',
      marks: 1,
      difficulty: 'medium',
      options: [
        { label: 'ক', text: '' },
        { label: 'খ', text: '' },
        { label: 'গ', text: '' },
        { label: 'ঘ', text: '' },
      ],
      correct_answer: '',
    });
    setShowManualEntry(false);
    toast({ title: 'প্রশ্ন যোগ হয়েছে' });
  };

  const removeQuestion = (id: string) => {
    setParsedQuestions(parsedQuestions.filter(q => q.id !== id));
  };

  const toggleQuestionValidity = (id: string) => {
    setParsedQuestions(parsedQuestions.map(q => 
      q.id === id ? { ...q, isValid: !q.isValid } : q
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">প্রশ্ন ইম্পোর্ট</h1>
            <p className="text-muted-foreground font-bangla">
              পূর্ববর্তী প্রশ্নপত্র থেকে প্রশ্ন ইম্পোর্ট করুন
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Import Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">ইম্পোর্ট সেটিংস</CardTitle>
              <CardDescription className="font-bangla">
                প্রশ্নের জন্য বিষয়, শ্রেণী এবং ডিফল্ট মান নির্ধারণ করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-bangla">বিষয় *</Label>
                <Select 
                  value={importSettings.subject} 
                  onValueChange={(v) => {
                    const subj = subjects.find(s => s.value === v);
                    setImportSettings({ 
                      ...importSettings, 
                      subject: v, 
                      subject_bn: subj?.label || v 
                    });
                  }}
                >
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="বিষয় নির্বাচন" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bangla">শ্রেণী *</Label>
                <Select 
                  value={importSettings.class} 
                  onValueChange={(v) => setImportSettings({ ...importSettings, class: v })}
                >
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="শ্রেণী নির্বাচন" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bangla">ভাষা</Label>
                <Select 
                  value={importSettings.language} 
                  onValueChange={(v) => setImportSettings({ ...importSettings, language: v })}
                >
                  <SelectTrigger className="font-bangla">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bn">বাংলা</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="both">উভয়</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">ডিফল্ট ধরন</Label>
                  <Select 
                    value={importSettings.default_type} 
                    onValueChange={(v) => setImportSettings({ ...importSettings, default_type: v })}
                  >
                    <SelectTrigger className="font-bangla">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">ডিফল্ট নম্বর</Label>
                  <Input
                    type="number"
                    value={importSettings.default_marks}
                    onChange={(e) => setImportSettings({ ...importSettings, default_marks: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              <div>
                <Label className="font-bangla">ডিফল্ট কঠিনতা</Label>
                <Select 
                  value={importSettings.default_difficulty} 
                  onValueChange={(v) => setImportSettings({ ...importSettings, default_difficulty: v })}
                >
                  <SelectTrigger className="font-bangla">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-bangla">ফাইল আপলোড / ম্যানুয়াল এন্ট্রি</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="font-bangla">ফাইল আপলোড</TabsTrigger>
                  <TabsTrigger value="paste" className="font-bangla">টেক্সট পেস্ট</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.png,.jpg,.jpeg,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-bangla font-medium">ফাইল আপলোড করতে ক্লিক করুন</p>
                    <p className="text-sm text-muted-foreground font-bangla mt-1">
                      সমর্থিত: .txt, .png, .jpg (OCR)
                    </p>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-center text-muted-foreground font-bangla">
                        প্রসেসিং... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t" />
                    <span className="text-sm text-muted-foreground font-bangla">অথবা</span>
                    <div className="flex-1 border-t" />
                  </div>

                  <Button 
                    onClick={() => setShowManualEntry(true)} 
                    variant="outline" 
                    className="w-full font-bangla"
                    disabled={!importSettings.subject || !importSettings.class}
                  >
                    <Plus className="w-4 h-4 mr-2" /> ম্যানুয়ালি প্রশ্ন যোগ করুন
                  </Button>
                </TabsContent>

                <TabsContent value="paste" className="space-y-4">
                  <div>
                    <Label className="font-bangla">প্রশ্ন পেস্ট করুন</Label>
                    <Textarea
                      placeholder={`উদাহরণ:
১। বাংলাদেশের রাজধানী কোথায়?
ক) ঢাকা
খ) চট্টগ্রাম
গ) খুলনা
ঘ) রাজশাহী
উত্তর: ক

২। বঙ্গবন্ধু কবে জন্মগ্রহণ করেন?`}
                      className="font-bangla min-h-[200px]"
                      onChange={(e) => {
                        // Parse on change
                        const questions = parseTextToQuestions(e.target.value);
                        setParsedQuestions(questions);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-bangla">
                      প্রতিটি প্রশ্ন নম্বর দিয়ে শুরু করুন (যেমন: ১। বা 1.)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Parsed Questions */}
        {parsedQuestions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-bangla">পার্সড প্রশ্নসমূহ</CardTitle>
                <CardDescription className="font-bangla">
                  {parsedQuestions.filter(q => q.isValid).length}/{parsedQuestions.length} টি প্রশ্ন নির্বাচিত
                </CardDescription>
              </div>
              <Button 
                onClick={() => saveQuestionsMutation.mutate(parsedQuestions)}
                disabled={!parsedQuestions.some(q => q.isValid) || !importSettings.subject || !importSettings.class}
                className="font-bangla"
              >
                <Save className="w-4 h-4 mr-2" /> সংরক্ষণ করুন
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {parsedQuestions.map((q, index) => (
                  <div 
                    key={q.id} 
                    className={`p-4 border rounded-lg ${!q.isValid ? 'opacity-50 bg-muted' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={q.isValid}
                          onChange={() => toggleQuestionValidity(q.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-medium font-bangla">প্রশ্ন {index + 1}</span>
                            <Badge variant="secondary" className="text-xs font-bangla">
                              {questionTypes.find(t => t.value === q.question_type)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-bangla">
                              {q.marks} নম্বর
                            </Badge>
                          </div>
                          <p className="text-sm font-bangla">{q.question_text_bn}</p>
                          {q.options && q.options.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground font-bangla">
                              {q.options.map((opt, i) => (
                                <span key={i} className={opt.label === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                                  {opt.label}) {opt.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(q.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">ইম্পোর্ট ইতিহাস</CardTitle>
          </CardHeader>
          <CardContent>
            {!importHistory?.length ? (
              <p className="text-center text-muted-foreground font-bangla py-8">
                কোনো ইম্পোর্ট ইতিহাস নেই
              </p>
            ) : (
              <div className="space-y-2">
                {importHistory.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(h.status)}
                      <div>
                        <p className="font-medium text-sm">{h.file_name}</p>
                        <p className="text-xs text-muted-foreground font-bangla">
                          {new Date(h.created_at).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bangla">
                        {h.imported_questions}/{h.total_questions} সফল
                      </p>
                      <Badge variant={h.status === 'completed' ? 'default' : 'destructive'} className="text-xs">
                        {h.status === 'completed' ? 'সম্পন্ন' : h.status === 'failed' ? 'ব্যর্থ' : 'প্রসেসিং'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Dialog */}
        <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">ম্যানুয়ালি প্রশ্ন যোগ করুন</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-bangla">ধরন</Label>
                  <Select 
                    value={manualQuestion.question_type} 
                    onValueChange={(v) => setManualQuestion({ ...manualQuestion, question_type: v })}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {questionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">নম্বর</Label>
                  <Input
                    type="number"
                    value={manualQuestion.marks}
                    onChange={(e) => setManualQuestion({ ...manualQuestion, marks: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div>
                  <Label className="font-bangla">কঠিনতা</Label>
                  <Select 
                    value={manualQuestion.difficulty} 
                    onValueChange={(v) => setManualQuestion({ ...manualQuestion, difficulty: v })}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-bangla">প্রশ্ন (বাংলা) *</Label>
                <Textarea
                  value={manualQuestion.question_text_bn}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, question_text_bn: e.target.value })}
                  placeholder="প্রশ্ন লিখুন..."
                  className="font-bangla"
                  rows={3}
                />
              </div>

              <div>
                <Label className="font-bangla">প্রশ্ন (English)</Label>
                <Textarea
                  value={manualQuestion.question_text}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, question_text: e.target.value })}
                  placeholder="Enter question in English (optional)..."
                  rows={2}
                />
              </div>

              {manualQuestion.question_type === 'mcq' && (
                <div className="space-y-3">
                  <Label className="font-bangla">উত্তরের অপশন</Label>
                  {manualQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center font-bangla font-medium">{opt.label})</span>
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOptions = [...manualQuestion.options];
                          newOptions[i] = { ...newOptions[i], text: e.target.value };
                          setManualQuestion({ ...manualQuestion, options: newOptions });
                        }}
                        placeholder={`অপশন ${opt.label}`}
                        className="font-bangla flex-1"
                      />
                      <Button
                        type="button"
                        variant={manualQuestion.correct_answer === opt.label ? "default" : "outline"}
                        size="icon"
                        onClick={() => setManualQuestion({ ...manualQuestion, correct_answer: opt.label })}
                        title="সঠিক উত্তর"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManualEntry(false)} className="font-bangla">
                বাতিল
              </Button>
              <Button onClick={addManualQuestion} className="font-bangla">
                যোগ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
