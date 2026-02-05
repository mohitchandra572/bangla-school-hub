import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, Search, User, Calendar, Plus, Send, 
  RefreshCw, GraduationCap, Award
} from 'lucide-react';
import { format } from 'date-fns';

const CERTIFICATE_TYPES = [
  { value: 'transfer_certificate', label: 'Transfer Certificate (TC)', label_bn: 'স্থানান্তর সনদ', icon: FileText },
  { value: 'testimonial', label: 'Testimonial', label_bn: 'সাক্ষ্যপত্র', icon: Award },
  { value: 'character_certificate', label: 'Character Certificate', label_bn: 'চরিত্র সনদ', icon: User },
  { value: 'study_certificate', label: 'Study Certificate', label_bn: 'অধ্যয়ন সনদ', icon: GraduationCap },
  { value: 'bonafide_certificate', label: 'Bonafide Certificate', label_bn: 'বোনাফাইড সনদ', icon: FileText },
];

const CLASSES = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];

export default function CertificateGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    leaving_date: '',
    reason_for_leaving: '',
    reason_for_leaving_bn: '',
    conduct: 'Good',
    conduct_bn: 'ভালো',
    last_exam_passed: '',
    last_exam_passed_bn: '',
    notes: '',
    notes_bn: '',
  });

  // Fetch students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-certificate', classFilter],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('full_name_bn');

      if (classFilter !== 'all') {
        query = query.eq('class', classFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Generate certificate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !selectedType) {
        throw new Error('শিক্ষার্থী এবং সার্টিফিকেট ধরন নির্বাচন করুন');
      }

      // Generate certificate number (will use DB function in production)
      const prefix = selectedType === 'transfer_certificate' ? 'TC' : 
                     selectedType === 'testimonial' ? 'TM' :
                     selectedType === 'character_certificate' ? 'CC' :
                     selectedType === 'study_certificate' ? 'SC' : 'BC';
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
      const certificateNumber = `${prefix}-${year}-${random}`;

      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 14).toUpperCase();

      const { error } = await supabase.from('certificates').insert({
        student_id: selectedStudent.id,
        certificate_type: selectedType as any,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        issue_date: formData.issue_date,
        student_name: selectedStudent.full_name,
        student_name_bn: selectedStudent.full_name_bn,
        father_name: selectedStudent.father_name,
        father_name_bn: selectedStudent.father_name_bn,
        mother_name: selectedStudent.mother_name,
        mother_name_bn: selectedStudent.mother_name_bn,
        class: selectedStudent.class,
        section: selectedStudent.section,
        roll_number: selectedStudent.roll_number,
        date_of_birth: selectedStudent.date_of_birth,
        admission_date: selectedStudent.admission_date,
        leaving_date: formData.leaving_date || null,
        reason_for_leaving: formData.reason_for_leaving,
        reason_for_leaving_bn: formData.reason_for_leaving_bn,
        conduct: formData.conduct,
        conduct_bn: formData.conduct_bn,
        last_exam_passed: formData.last_exam_passed,
        last_exam_passed_bn: formData.last_exam_passed_bn,
        notes: formData.notes,
        notes_bn: formData.notes_bn,
        status: 'pending_approval' as any,
        requested_by: user?.id,
        requested_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({ title: 'সফল!', description: 'সার্টিফিকেট অনুমোদনের জন্য জমা দেওয়া হয়েছে' });
      setSelectedStudent(null);
      setSelectedType('');
      setFormData({
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        leaving_date: '',
        reason_for_leaving: '',
        reason_for_leaving_bn: '',
        conduct: 'Good',
        conduct_bn: 'ভালো',
        last_exam_passed: '',
        last_exam_passed_bn: '',
        notes: '',
        notes_bn: '',
      });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const filteredStudents = students?.filter((student) =>
    student.full_name_bn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_number?.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">সার্টিফিকেট তৈরি</h1>
          <p className="text-muted-foreground font-bangla">
            শিক্ষার্থীদের জন্য বিভিন্ন ধরনের সার্টিফিকেট তৈরি করুন
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Student Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla text-lg">শিক্ষার্থী নির্বাচন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="নাম বা রোল খুঁজুন..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-bangla"
                    />
                  </div>
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="font-bangla">
                    <SelectValue placeholder="শ্রেণি ফিল্টার" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-bangla">সব শ্রেণি</SelectItem>
                    {CLASSES.map(cls => (
                      <SelectItem key={cls} value={cls} className="font-bangla">{cls} শ্রেণি</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {studentsLoading ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    </div>
                  ) : filteredStudents?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 font-bangla">
                      কোনো শিক্ষার্থী পাওয়া যায়নি
                    </p>
                  ) : (
                    filteredStudents?.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStudent?.id === student.id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <p className="font-medium font-bangla">{student.full_name_bn || student.full_name}</p>
                        <p className="text-sm text-muted-foreground font-bangla">
                          {student.class} শ্রেণি | রোল: {student.roll_number}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Certificate Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Certificate Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla text-lg">সার্টিফিকেট ধরন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CERTIFICATE_TYPES.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedType === type.value
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <type.icon className={`w-6 h-6 mb-2 ${
                        selectedType === type.value ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className="font-medium font-bangla text-sm">{type.label_bn}</p>
                      <p className="text-xs text-muted-foreground">{type.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Student Info */}
            {selectedStudent && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla text-lg">শিক্ষার্থীর তথ্য</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground font-bangla">নাম</Label>
                      <p className="font-medium font-bangla">{selectedStudent.full_name_bn || selectedStudent.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground font-bangla">রোল নম্বর</Label>
                      <p className="font-medium">{selectedStudent.roll_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground font-bangla">শ্রেণি</Label>
                      <p className="font-medium font-bangla">{selectedStudent.class} {selectedStudent.section && `- ${selectedStudent.section}`}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground font-bangla">ভর্তির তারিখ</Label>
                      <p className="font-medium">
                        {selectedStudent.admission_date && format(new Date(selectedStudent.admission_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground font-bangla">পিতার নাম</Label>
                      <p className="font-medium font-bangla">{selectedStudent.father_name_bn || selectedStudent.father_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground font-bangla">মাতার নাম</Label>
                      <p className="font-medium font-bangla">{selectedStudent.mother_name_bn || selectedStudent.mother_name || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificate Details Form */}
            {selectedType && selectedStudent && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-bangla text-lg">সার্টিফিকেট বিবরণ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla">ইস্যুর তারিখ</Label>
                      <Input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      />
                    </div>

                    {selectedType === 'transfer_certificate' && (
                      <>
                        <div>
                          <Label className="font-bangla">ত্যাগের তারিখ</Label>
                          <Input
                            type="date"
                            value={formData.leaving_date}
                            onChange={(e) => setFormData({ ...formData, leaving_date: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="font-bangla">ত্যাগের কারণ (বাংলা)</Label>
                          <Textarea
                            value={formData.reason_for_leaving_bn}
                            onChange={(e) => setFormData({ ...formData, reason_for_leaving_bn: e.target.value })}
                            placeholder="যেমন: পারিবারিক কারণে স্থানান্তর"
                            className="font-bangla"
                          />
                        </div>
                        <div>
                          <Label className="font-bangla">আচরণ (বাংলা)</Label>
                          <Select 
                            value={formData.conduct_bn} 
                            onValueChange={(v) => setFormData({ ...formData, conduct_bn: v, conduct: v === 'ভালো' ? 'Good' : v === 'অতি উত্তম' ? 'Excellent' : 'Satisfactory' })}
                          >
                            <SelectTrigger className="font-bangla">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="অতি উত্তম" className="font-bangla">অতি উত্তম</SelectItem>
                              <SelectItem value="ভালো" className="font-bangla">ভালো</SelectItem>
                              <SelectItem value="সন্তোষজনক" className="font-bangla">সন্তোষজনক</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="font-bangla">সর্বশেষ পাস করা পরীক্ষা</Label>
                          <Input
                            value={formData.last_exam_passed_bn}
                            onChange={(e) => setFormData({ ...formData, last_exam_passed_bn: e.target.value })}
                            placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৪"
                            className="font-bangla"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <Label className="font-bangla">অতিরিক্ত মন্তব্য (বাংলা)</Label>
                    <Textarea
                      value={formData.notes_bn}
                      onChange={(e) => setFormData({ ...formData, notes_bn: e.target.value })}
                      placeholder="কোনো বিশেষ মন্তব্য থাকলে লিখুন..."
                      className="font-bangla"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedStudent(null);
                        setSelectedType('');
                      }}
                      className="font-bangla"
                    >
                      বাতিল
                    </Button>
                    <Button
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                      className="font-bangla"
                    >
                      {generateMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      অনুমোদনের জন্য জমা দিন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedStudent && !selectedType && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-bangla text-muted-foreground">
                    বাম পাশ থেকে শিক্ষার্থী নির্বাচন করুন এবং সার্টিফিকেট ধরন বেছে নিন
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
