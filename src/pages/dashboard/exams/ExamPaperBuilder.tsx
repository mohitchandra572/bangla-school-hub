import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Save, Eye, Trash2, GripVertical, FileText, 
  CheckCircle, HelpCircle, AlignLeft, List 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const questionTypes = [
  { value: 'mcq', label: 'বহুনির্বাচনী (MCQ)', icon: List },
  { value: 'short', label: 'সংক্ষিপ্ত উত্তর', icon: AlignLeft },
  { value: 'essay', label: 'রচনামূলক', icon: FileText },
  { value: 'fill_blank', label: 'শূন্যস্থান পূরণ', icon: HelpCircle },
];

const subjects = ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'সমাজ', 'ধর্ম', 'তথ্যপ্রযুক্তি'];

interface Question {
  id?: string;
  question_type: string;
  question_text: string;
  question_text_bn: string;
  options?: { label: string; text: string }[];
  correct_answer?: string;
  marks: number;
  order_index: number;
}

export default function ExamPaperBuilder() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [paper, setPaper] = useState({
    subject: '',
    subject_bn: '',
    title: '',
    title_bn: '',
    total_marks: 100,
    duration_minutes: 60,
    instructions_bn: '',
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_type: 'mcq',
    question_text: '',
    question_text_bn: '',
    options: [
      { label: 'ক', text: '' },
      { label: 'খ', text: '' },
      { label: 'গ', text: '' },
      { label: 'ঘ', text: '' },
    ],
    correct_answer: '',
    marks: 1,
    order_index: 0,
  });

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  const { data: existingPapers } = useQuery({
    queryKey: ['exam-papers', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_papers')
        .select('*, exam_questions(*)')
        .eq('exam_id', examId);
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  const savePaperMutation = useMutation({
    mutationFn: async () => {
      // Create paper
      const { data: paperData, error: paperError } = await supabase
        .from('exam_papers')
        .insert([{
          exam_id: examId,
          subject: paper.subject,
          subject_bn: paper.subject_bn,
          title: paper.title_bn,
          title_bn: paper.title_bn,
          total_marks: paper.total_marks,
          duration_minutes: paper.duration_minutes,
          instructions_bn: paper.instructions_bn,
          created_by: user?.id,
          status: 'draft',
        }])
        .select()
        .single();
      
      if (paperError) throw paperError;

      // Create questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q, i) => ({
          paper_id: paperData.id,
          question_type: q.question_type,
          question_text: q.question_text_bn,
          question_text_bn: q.question_text_bn,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks,
          order_index: i,
        }));

        const { error: questionsError } = await supabase
          .from('exam_questions')
          .insert(questionsToInsert);
        
        if (questionsError) throw questionsError;
      }

      return paperData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-papers', examId] });
      toast({ title: 'সফল!', description: 'প্রশ্নপত্র সংরক্ষিত হয়েছে' });
      navigate(`/dashboard/exams`);
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, { ...currentQuestion, order_index: questions.length }]);
    setCurrentQuestion({
      question_type: 'mcq',
      question_text: '',
      question_text_bn: '',
      options: [
        { label: 'ক', text: '' },
        { label: 'খ', text: '' },
        { label: 'গ', text: '' },
        { label: 'ঘ', text: '' },
      ],
      correct_answer: '',
      marks: 1,
      order_index: 0,
    });
    setShowAddQuestion(false);
    toast({ title: 'প্রশ্ন যোগ হয়েছে' });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">প্রশ্নপত্র তৈরি</h1>
            <p className="text-muted-foreground font-bangla">
              {exam?.name_bn || exam?.name} • {exam?.class} শ্রেণী
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)} className="font-bangla">
              <Eye className="w-4 h-4 mr-2" /> প্রিভিউ
            </Button>
            <Button 
              onClick={() => savePaperMutation.mutate()} 
              disabled={!paper.subject_bn || questions.length === 0}
              className="font-bangla"
            >
              <Save className="w-4 h-4 mr-2" /> সংরক্ষণ
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Paper Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-bangla">প্রশ্নপত্রের বিবরণ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-bangla">বিষয়</Label>
                <Select value={paper.subject_bn} onValueChange={(v) => setPaper({ ...paper, subject_bn: v, subject: v })}>
                  <SelectTrigger className="font-bangla"><SelectValue placeholder="বিষয় নির্বাচন" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bangla">শিরোনাম</Label>
                <Input
                  value={paper.title_bn}
                  onChange={(e) => setPaper({ ...paper, title_bn: e.target.value, title: e.target.value })}
                  placeholder="যেমন: প্রথম সাময়িক পরীক্ষা - বাংলা"
                  className="font-bangla"
                />
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
                  placeholder="পরীক্ষার্থীদের জন্য নির্দেশনা..."
                  className="font-bangla"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm font-bangla">
                  <span>মোট প্রশ্ন:</span>
                  <span className="font-semibold">{questions.length} টি</span>
                </div>
                <div className="flex justify-between text-sm font-bangla mt-1">
                  <span>মোট নম্বর:</span>
                  <span className="font-semibold">{totalMarks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-bangla">প্রশ্নসমূহ</CardTitle>
              <Button onClick={() => setShowAddQuestion(true)} size="sm" className="font-bangla">
                <Plus className="w-4 h-4 mr-1" /> প্রশ্ন যোগ
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-bangla">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>কোনো প্রশ্ন যোগ করা হয়নি</p>
                  <p className="text-sm">উপরের বাটনে ক্লিক করে প্রশ্ন যোগ করুন</p>
                </div>
              ) : (
                <Reorder.Group values={questions} onReorder={setQuestions} className="space-y-3">
                  {questions.map((q, index) => (
                    <Reorder.Item key={index} value={q} className="cursor-move">
                      <motion.div
                        layout
                        className="bg-muted/50 rounded-lg p-4 flex items-start gap-3 group"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium font-bangla">প্রশ্ন {index + 1}</span>
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-bangla">
                              {questionTypes.find(t => t.value === q.question_type)?.label}
                            </span>
                            <span className="text-xs text-muted-foreground font-bangla">{q.marks} নম্বর</span>
                          </div>
                          <p className="text-sm font-bangla">{q.question_text_bn}</p>
                          {q.question_type === 'mcq' && q.options && (
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground font-bangla">
                              {q.options.map((opt, i) => (
                                <span key={i} className={opt.label === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                                  {opt.label}) {opt.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          className="opacity-0 group-hover:opacity-100 text-destructive"
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

        {/* Add Question Dialog */}
        <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">নতুন প্রশ্ন যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">প্রশ্নের ধরন</Label>
                  <Select 
                    value={currentQuestion.question_type} 
                    onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, question_type: v })}
                  >
                    <SelectTrigger className="font-bangla"><SelectValue /></SelectTrigger>
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
                  <Label className="font-bangla">নম্বর</Label>
                  <Input
                    type="number"
                    value={currentQuestion.marks}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label className="font-bangla">প্রশ্ন (বাংলা)</Label>
                <Textarea
                  value={currentQuestion.question_text_bn}
                  onChange={(e) => setCurrentQuestion({ 
                    ...currentQuestion, 
                    question_text_bn: e.target.value,
                    question_text: e.target.value 
                  })}
                  placeholder="প্রশ্ন লিখুন..."
                  className="font-bangla"
                  rows={3}
                />
              </div>

              {currentQuestion.question_type === 'mcq' && (
                <div className="space-y-3">
                  <Label className="font-bangla">উত্তরের অপশন</Label>
                  {currentQuestion.options?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center font-bangla">{opt.label})</span>
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOptions = [...(currentQuestion.options || [])];
                          newOptions[i] = { ...newOptions[i], text: e.target.value };
                          setCurrentQuestion({ ...currentQuestion, options: newOptions });
                        }}
                        placeholder={`অপশন ${opt.label}`}
                        className="font-bangla"
                      />
                      <Button
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddQuestion(false)} className="font-bangla">
                  বাতিল
                </Button>
                <Button 
                  onClick={addQuestion}
                  disabled={!currentQuestion.question_text_bn}
                  className="font-bangla"
                >
                  প্রশ্ন যোগ করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">প্রশ্নপত্র প্রিভিউ</DialogTitle>
            </DialogHeader>
            <div className="p-6 bg-white text-black rounded-lg border-2 border-black">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold font-bangla">আদর্শ বিদ্যালয়</h2>
                <p className="font-bangla">{exam?.name_bn || exam?.name} - {exam?.class} শ্রেণী</p>
                <p className="text-lg font-semibold mt-2 font-bangla">{paper.subject_bn}</p>
                <div className="flex justify-center gap-8 mt-2 text-sm font-bangla">
                  <span>সময়: {paper.duration_minutes} মিনিট</span>
                  <span>পূর্ণমান: {paper.total_marks}</span>
                </div>
              </div>

              {paper.instructions_bn && (
                <div className="mb-4 p-3 bg-gray-100 rounded font-bangla text-sm">
                  <strong>নির্দেশনা:</strong> {paper.instructions_bn}
                </div>
              )}

              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={index} className="border-b pb-3">
                    <div className="flex gap-2">
                      <span className="font-semibold font-bangla">{index + 1}।</span>
                      <div className="flex-1">
                        <p className="font-bangla">{q.question_text_bn}</p>
                        <span className="text-xs text-gray-500 font-bangla">({q.marks} নম্বর)</span>
                        {q.question_type === 'mcq' && q.options && (
                          <div className="mt-2 grid grid-cols-2 gap-1 text-sm font-bangla">
                            {q.options.map((opt, i) => (
                              <span key={i}>{opt.label}) {opt.text}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
