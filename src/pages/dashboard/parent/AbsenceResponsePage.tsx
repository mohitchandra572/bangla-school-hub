import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, AlertTriangle, Calendar, Clock, User, 
  School, FileText, Send, ArrowLeft, Upload, Fingerprint, PenTool
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

const reasonCategories = [
  { value: 'illness', label: 'অসুস্থতা', labelEn: 'Illness' },
  { value: 'family', label: 'পারিবারিক কারণ', labelEn: 'Family Reason' },
  { value: 'permission', label: 'অনুমতি নিয়ে', labelEn: 'With Permission' },
  { value: 'other', label: 'অন্যান্য', labelEn: 'Other' },
];

export default function AbsenceResponsePage() {
  const { attendanceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [responseMode, setResponseMode] = useState<'view' | 'reason' | 'correction'>('view');
  const [reasonCategory, setReasonCategory] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');

  // Fetch attendance details with student info
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance-detail', attendanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students (
            id, full_name, full_name_bn, class, section, roll_number, photo_url, parent_id,
            schools (name, name_bn, address, logo_url)
          )
        `)
        .eq('id', attendanceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!attendanceId,
  });

  // Check if response already exists
  const { data: existingResponse } = useQuery({
    queryKey: ['absence-response', attendanceId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absence_responses')
        .select('*')
        .eq('attendance_id', attendanceId)
        .eq('parent_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!attendanceId && !!user?.id,
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('absence_responses')
        .upsert({
          attendance_id: attendanceId,
          student_id: attendance?.student_id,
          parent_id: user?.id,
          response_type: 'acknowledged',
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        }, { onConflict: 'attendance_id,parent_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-response'] });
      toast({ title: 'সফল!', description: 'আপনার প্রতিক্রিয়া রেকর্ড করা হয়েছে' });
    },
    onError: () => {
      toast({ title: 'ত্রুটি', description: 'প্রতিক্রিয়া জমা দিতে ব্যর্থ', variant: 'destructive' });
    },
  });

  // Submit reason mutation
  const submitReasonMutation = useMutation({
    mutationFn: async () => {
      const category = reasonCategories.find(c => c.value === reasonCategory);
      const { error } = await supabase
        .from('absence_responses')
        .upsert({
          attendance_id: attendanceId,
          student_id: attendance?.student_id,
          parent_id: user?.id,
          response_type: 'reason_submitted',
          reason_category: reasonCategory,
          reason_category_bn: category?.label,
          reason_text: reasonText,
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        }, { onConflict: 'attendance_id,parent_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-response'] });
      setResponseMode('view');
      toast({ title: 'সফল!', description: 'অনুপস্থিতির কারণ জমা দেওয়া হয়েছে' });
    },
    onError: () => {
      toast({ title: 'ত্রুটি', description: 'কারণ জমা দিতে ব্যর্থ', variant: 'destructive' });
    },
  });

  // Request correction mutation
  const requestCorrectionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('absence_responses')
        .upsert({
          attendance_id: attendanceId,
          student_id: attendance?.student_id,
          parent_id: user?.id,
          response_type: 'correction_requested',
          correction_note: correctionNote,
          admin_status: 'pending',
        }, { onConflict: 'attendance_id,parent_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-response'] });
      setResponseMode('view');
      toast({ title: 'সফল!', description: 'সংশোধন অনুরোধ পাঠানো হয়েছে' });
    },
    onError: () => {
      toast({ title: 'ত্রুটি', description: 'অনুরোধ পাঠাতে ব্যর্থ', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!attendance) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="font-bangla text-xl">তথ্য পাওয়া যায়নি</p>
        </div>
      </DashboardLayout>
    );
  }

  const student = attendance.students;
  const school = student?.schools;
  const attendanceDate = new Date(attendance.date);

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    present: { bg: 'bg-green-100', text: 'text-green-700', label: 'উপস্থিত' },
    absent: { bg: 'bg-red-100', text: 'text-red-700', label: 'অনুপস্থিত' },
    late: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'বিলম্বে' },
    leave: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ছুটি' },
  };

  const status = statusConfig[attendance.status] || statusConfig.absent;

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-bangla">অনুপস্থিতির বিজ্ঞপ্তি</h1>
            <p className="text-sm text-muted-foreground font-bangla">
              {school?.name_bn || school?.name}
            </p>
          </div>
        </div>

        {/* Student Info Card - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Student Photo */}
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {student?.photo_url ? (
                    <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                {/* Student Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg font-bangla">
                    {student?.full_name_bn || student?.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-bangla">
                    {student?.class} শ্রেণি{student?.section && `, ${student.section} শাখা`}
                  </p>
                  <p className="text-sm text-muted-foreground font-bangla">
                    রোল: {student?.roll_number}
                  </p>
                </div>
              </div>

              {/* Status & Date */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-bangla">তারিখ</p>
                    <p className="font-semibold font-bangla">
                      {format(attendanceDate, 'dd MMMM yyyy', { locale: bn })}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 p-3 rounded-lg ${status.bg}`}>
                  <AlertTriangle className={`w-5 h-5 ${status.text}`} />
                  <div>
                    <p className="text-xs text-muted-foreground font-bangla">অবস্থা</p>
                    <p className={`font-bold font-bangla ${status.text}`}>
                      {status.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Source */}
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                {attendance.source === 'biometric' ? (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span className="font-bangla">বায়োমেট্রিক থেকে</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4" />
                    <span className="font-bangla">ম্যানুয়াল এন্ট্রি</span>
                  </>
                )}
                {attendance.check_in_time && (
                  <span className="ml-2 font-bangla">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {attendance.check_in_time}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Status */}
        {existingResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 font-bangla">
                      {existingResponse.response_type === 'acknowledged' && 'আপনি দেখেছেন বলে চিহ্নিত করেছেন'}
                      {existingResponse.response_type === 'reason_submitted' && 'কারণ জমা দেওয়া হয়েছে'}
                      {existingResponse.response_type === 'correction_requested' && 'সংশোধন অনুরোধ করা হয়েছে'}
                    </p>
                    {existingResponse.reason_category_bn && (
                      <p className="text-sm text-green-600 font-bangla">
                        কারণ: {existingResponse.reason_category_bn}
                      </p>
                    )}
                    {existingResponse.admin_status !== 'pending' && (
                      <Badge variant={existingResponse.admin_status === 'approved' ? 'default' : 'destructive'}>
                        {existingResponse.admin_status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons - Mobile First Big Buttons */}
        {responseMode === 'view' && !existingResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bangla"
              onClick={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              দেখেছি
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg font-bangla"
              onClick={() => setResponseMode('reason')}
            >
              <FileText className="w-6 h-6 mr-2" />
              কারণ দিন
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              className="w-full h-14 text-lg font-bangla"
              onClick={() => setResponseMode('correction')}
            >
              <AlertTriangle className="w-6 h-6 mr-2" />
              ভুল মনে হচ্ছে
            </Button>
          </motion.div>
        )}

        {/* Reason Submission Form */}
        {responseMode === 'reason' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">অনুপস্থিতির কারণ দিন</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bangla">কারণের ধরন</Label>
                  <Select value={reasonCategory} onValueChange={setReasonCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="কারণ নির্বাচন করুন" className="font-bangla" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="font-bangla">{cat.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bangla">বিস্তারিত (ঐচ্ছিক)</Label>
                  <Textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="অতিরিক্ত বিবরণ লিখুন..."
                    className="font-bangla"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 font-bangla"
                    onClick={() => setResponseMode('view')}
                  >
                    বাতিল
                  </Button>
                  <Button
                    className="flex-1 font-bangla"
                    onClick={() => submitReasonMutation.mutate()}
                    disabled={!reasonCategory || submitReasonMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    জমা দিন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Correction Request Form */}
        {responseMode === 'correction' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">সংশোধন অনুরোধ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 font-bangla">
                    যদি আপনি মনে করেন এই উপস্থিতি রেকর্ডে ভুল আছে, অনুগ্রহ করে বিস্তারিত জানান।
                    প্রশাসক পর্যালোচনা করবেন।
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-bangla">কী ভুল আছে?</Label>
                  <Textarea
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    placeholder="উদাহরণ: আমার সন্তান আজ স্কুলে ছিল, কিন্তু বায়োমেট্রিক কাজ করেনি..."
                    className="font-bangla"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 font-bangla"
                    onClick={() => setResponseMode('view')}
                  >
                    বাতিল
                  </Button>
                  <Button
                    className="flex-1 font-bangla"
                    onClick={() => requestCorrectionMutation.mutate()}
                    disabled={!correctionNote.trim() || requestCorrectionMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    অনুরোধ পাঠান
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            variant="link"
            className="w-full font-bangla"
            onClick={() => navigate('/dashboard/parent/attendance-history')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            সম্পূর্ণ উপস্থিতির ইতিহাস দেখুন
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
