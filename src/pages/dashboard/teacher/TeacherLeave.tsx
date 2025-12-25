import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Calendar, Plus, Clock, CheckCircle, XCircle,
  FileText, AlertTriangle, CalendarDays
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { bn } from 'date-fns/locale';

const leaveTypes = [
  { value: 'sick', label: 'অসুস্থতাজনিত ছুটি', label_en: 'Sick Leave' },
  { value: 'casual', label: 'নৈমিত্তিক ছুটি', label_en: 'Casual Leave' },
  { value: 'earned', label: 'অর্জিত ছুটি', label_en: 'Earned Leave' },
  { value: 'maternity', label: 'মাতৃত্বকালীন ছুটি', label_en: 'Maternity Leave' },
  { value: 'emergency', label: 'জরুরি ছুটি', label_en: 'Emergency Leave' },
  { value: 'other', label: 'অন্যান্য', label_en: 'Other' },
];

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'অপেক্ষমাণ', icon: Clock },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'অনুমোদিত', icon: CheckCircle },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'প্রত্যাখ্যাত', icon: XCircle },
};

export default function TeacherLeave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    document_url: '',
  });

  // Fetch teacher info
  const { data: teacher } = useQuery({
    queryKey: ['teacher-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch leave requests
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['teacher-leaves', teacher?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('teacher_id', teacher?.id)
        .eq('source', 'leave_request')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!teacher?.id,
  });

  // Calculate leave balance (mock data for demo)
  const leaveBalance = {
    sick: { total: 14, used: 3, remaining: 11 },
    casual: { total: 10, used: 2, remaining: 8 },
    earned: { total: 20, used: 5, remaining: 15 },
  };

  // Submit leave request
  const submitMutation = useMutation({
    mutationFn: async () => {
      const days = differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;
      
      // Create leave records for each day
      const records = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(formData.start_date);
        date.setDate(date.getDate() + i);
        
        records.push({
          teacher_id: teacher?.id,
          date: format(date, 'yyyy-MM-dd'),
          status: 'leave',
          source: 'leave_request',
          approval_status: 'pending',
          remarks: `${leaveTypes.find(t => t.value === formData.leave_type)?.label}: ${formData.reason}`,
        });
      }

      for (const record of records) {
        const { error } = await supabase
          .from('teacher_attendance')
          .insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('ছুটির আবেদন সফলভাবে জমা দেওয়া হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['teacher-leaves'] });
      setIsOpen(false);
      setFormData({
        leave_type: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        document_url: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'আবেদন জমা দিতে সমস্যা হয়েছে');
    },
  });

  const days = differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;

  // Group leave requests by date range
  const groupedLeaves = leaveRequests?.reduce((acc: any[], leave) => {
    const existing = acc.find(l => l.remarks === leave.remarks && l.approval_status === leave.approval_status);
    if (existing) {
      existing.dates.push(leave.date);
      existing.endDate = leave.date > existing.endDate ? leave.date : existing.endDate;
    } else {
      acc.push({
        ...leave,
        dates: [leave.date],
        startDate: leave.date,
        endDate: leave.date,
      });
    }
    return acc;
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Calendar className="w-7 h-7" />
              ছুটির আবেদন
            </h1>
            <p className="text-muted-foreground font-bangla">
              আপনার ছুটির আবেদন ও ব্যালেন্স
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="font-bangla">
                <Plus className="w-4 h-4 mr-2" /> নতুন আবেদন
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-bangla">নতুন ছুটির আবেদন</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="font-bangla">ছুটির ধরন</Label>
                  <Select value={formData.leave_type} onValueChange={(v) => setFormData({ ...formData, leave_type: v })}>
                    <SelectTrigger className="font-bangla">
                      <SelectValue placeholder="ছুটির ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="font-bangla">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bangla">শুরুর তারিখ</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bangla">শেষ তারিখ</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      min={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {days > 0 && (
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="font-bangla">মোট <strong>{days}</strong> দিনের ছুটি</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-bangla">কারণ</Label>
                  <Textarea
                    placeholder="ছুটির কারণ বিস্তারিত লিখুন..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="font-bangla"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={() => submitMutation.mutate()} 
                  disabled={submitMutation.isPending || !formData.leave_type || !formData.reason}
                  className="w-full font-bangla"
                >
                  {submitMutation.isPending ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leave Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-bangla">অসুস্থতাজনিত ছুটি</p>
                  <p className="text-3xl font-bold">{leaveBalance.sick.remaining}</p>
                  <p className="text-sm text-blue-200 font-bangla">
                    {leaveBalance.sick.used}/{leaveBalance.sick.total} ব্যবহৃত
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-bangla">নৈমিত্তিক ছুটি</p>
                  <p className="text-3xl font-bold">{leaveBalance.casual.remaining}</p>
                  <p className="text-sm text-green-200 font-bangla">
                    {leaveBalance.casual.used}/{leaveBalance.casual.total} ব্যবহৃত
                  </p>
                </div>
                <CalendarDays className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-bangla">অর্জিত ছুটি</p>
                  <p className="text-3xl font-bold">{leaveBalance.earned.remaining}</p>
                  <p className="text-sm text-purple-200 font-bangla">
                    {leaveBalance.earned.used}/{leaveBalance.earned.total} ব্যবহৃত
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla flex items-center gap-2">
              <FileText className="w-5 h-5" />
              আমার ছুটির আবেদনসমূহ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : groupedLeaves?.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground font-bangla">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                কোনো ছুটির আবেদন নেই
              </div>
            ) : (
              <div className="space-y-3">
                {groupedLeaves?.map((leave: any, index: number) => {
                  const status = statusConfig[leave.approval_status || 'pending'];
                  const StatusIcon = status.icon;
                  const leaveTypeLabel = leave.remarks?.split(':')[0] || 'ছুটি';
                  const reason = leave.remarks?.split(':')[1]?.trim() || '';
                  
                  return (
                    <motion.div
                      key={leave.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`border-l-4 ${leave.approval_status === 'approved' ? 'border-l-green-500' : leave.approval_status === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full ${status.bg} flex items-center justify-center`}>
                                <StatusIcon className={`w-6 h-6 ${status.text}`} />
                              </div>
                              <div>
                                <h4 className="font-semibold font-bangla">{leaveTypeLabel}</h4>
                                <p className="text-sm text-muted-foreground font-bangla">
                                  {format(new Date(leave.startDate), 'dd MMM', { locale: bn })} 
                                  {leave.startDate !== leave.endDate && ` - ${format(new Date(leave.endDate), 'dd MMM yyyy', { locale: bn })}`}
                                  {leave.startDate === leave.endDate && ` ${format(new Date(leave.startDate), 'yyyy', { locale: bn })}`}
                                  {' '} ({leave.dates.length} দিন)
                                </p>
                                {reason && (
                                  <p className="text-sm text-muted-foreground mt-1 font-bangla line-clamp-1">
                                    কারণ: {reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge className={`${status.bg} ${status.text}`}>
                              {status.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
