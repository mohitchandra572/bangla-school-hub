import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, XCircle, Clock, Search, User, 
  Calendar, FileText, AlertTriangle, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

const statusLabels: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
};

const responseTypeLabels: Record<string, string> = {
  pending: 'দেখেনি',
  acknowledged: 'দেখেছেন',
  reason_submitted: 'কারণ দিয়েছেন',
  correction_requested: 'সংশোধন চেয়েছেন',
};

export default function AbsenceResponsesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');

  // Fetch all absence responses with student and attendance info
  const { data: responses, isLoading } = useQuery({
    queryKey: ['admin-absence-responses', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('absence_responses')
        .select(`
          *,
          students (
            id, full_name, full_name_bn, class, section, roll_number, photo_url
          ),
          attendance (
            id, date, status, source, check_in_time
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('admin_status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase
        .from('absence_responses')
        .update({
          admin_status: 'approved',
          admin_note: adminNote,
          admin_reviewed_by: user?.id,
          admin_reviewed_at: new Date().toISOString(),
        })
        .eq('id', responseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absence-responses'] });
      setSelectedResponse(null);
      setAdminNote('');
      toast({ title: 'সফল!', description: 'অনুমোদন করা হয়েছে' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase
        .from('absence_responses')
        .update({
          admin_status: 'rejected',
          admin_note: adminNote,
          admin_reviewed_by: user?.id,
          admin_reviewed_at: new Date().toISOString(),
        })
        .eq('id', responseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absence-responses'] });
      setSelectedResponse(null);
      setAdminNote('');
      toast({ title: 'প্রত্যাখ্যাত', description: 'অনুরোধ প্রত্যাখ্যান করা হয়েছে' });
    },
  });

  // Update attendance mutation (for correction requests)
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, newStatus }: { attendanceId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', attendanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absence-responses'] });
      toast({ title: 'সফল!', description: 'উপস্থিতি আপডেট করা হয়েছে' });
    },
  });

  // Filter responses by search
  const filteredResponses = responses?.filter((response) => {
    if (!searchQuery) return true;
    const student = response.students;
    const searchLower = searchQuery.toLowerCase();
    return (
      student?.full_name?.toLowerCase().includes(searchLower) ||
      student?.full_name_bn?.includes(searchQuery) ||
      student?.roll_number?.toLowerCase().includes(searchLower)
    );
  });

  // Count by status
  const counts = {
    pending: responses?.filter(r => r.admin_status === 'pending').length || 0,
    approved: responses?.filter(r => r.admin_status === 'approved').length || 0,
    rejected: responses?.filter(r => r.admin_status === 'rejected').length || 0,
    all: responses?.length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">অনুপস্থিতি প্রতিক্রিয়া ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">
              অভিভাবকদের প্রতিক্রিয়া পর্যালোচনা ও অনুমোদন করুন
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="শিক্ষার্থী খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-bangla"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="font-bangla">
              অপেক্ষমাণ ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="font-bangla">
              অনুমোদিত ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="font-bangla">
              প্রত্যাখ্যাত ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger value="all" className="font-bangla">
              সকল ({counts.all})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredResponses?.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-bangla">কোনো প্রতিক্রিয়া নেই</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredResponses?.map((response, index) => {
                  const student = response.students;
                  const attendance = response.attendance;
                  const adminStatus = statusColors[response.admin_status] || statusColors.pending;
                  
                  return (
                    <motion.div
                      key={response.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className={`
                        ${response.response_type === 'correction_requested' ? 'border-l-4 border-l-yellow-500' : ''}
                        ${response.response_type === 'reason_submitted' ? 'border-l-4 border-l-blue-500' : ''}
                      `}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Student Info */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {student?.photo_url ? (
                                  <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold font-bangla">
                                  {student?.full_name_bn || student?.full_name}
                                </h4>
                                <p className="text-sm text-muted-foreground font-bangla">
                                  {student?.class} শ্রেণি{student?.section && `, ${student.section}`} | রোল: {student?.roll_number}
                                </p>
                              </div>
                            </div>

                            {/* Date & Response Type */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="font-bangla">
                                <Calendar className="w-3 h-3 mr-1" />
                                {attendance?.date && format(new Date(attendance.date), 'dd MMM yyyy', { locale: bn })}
                              </Badge>
                              <Badge 
                                className={`
                                  ${response.response_type === 'correction_requested' ? 'bg-yellow-100 text-yellow-700' : ''}
                                  ${response.response_type === 'reason_submitted' ? 'bg-blue-100 text-blue-700' : ''}
                                  ${response.response_type === 'acknowledged' ? 'bg-green-100 text-green-700' : ''}
                                `}
                              >
                                {responseTypeLabels[response.response_type]}
                              </Badge>
                              <Badge className={`${adminStatus.bg} ${adminStatus.text}`}>
                                {statusLabels[response.admin_status]}
                              </Badge>
                            </div>
                          </div>

                          {/* Response Details */}
                          {(response.reason_category_bn || response.reason_text || response.correction_note) && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              {response.reason_category_bn && (
                                <p className="font-medium font-bangla">
                                  কারণ: {response.reason_category_bn}
                                </p>
                              )}
                              {response.reason_text && (
                                <p className="text-sm text-muted-foreground font-bangla mt-1">
                                  {response.reason_text}
                                </p>
                              )}
                              {response.correction_note && (
                                <div className="flex items-start gap-2 mt-2">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm font-bangla text-yellow-700">
                                    {response.correction_note}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Admin Note (if reviewed) */}
                          {response.admin_note && (
                            <div className="mt-3 p-2 bg-primary/10 rounded-lg">
                              <p className="text-sm font-bangla">
                                <strong>প্রশাসক মন্তব্য:</strong> {response.admin_note}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons (for pending) */}
                          {response.admin_status === 'pending' && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedResponse(response);
                                  setAdminNote('');
                                }}
                                className="font-bangla"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                পর্যালোচনা
                              </Button>
                              {response.response_type === 'correction_requested' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    updateAttendanceMutation.mutate({
                                      attendanceId: response.attendance_id,
                                      newStatus: 'present',
                                    });
                                    approveMutation.mutate(response.id);
                                  }}
                                  className="font-bangla"
                                >
                                  উপস্থিত করুন
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-bangla">প্রতিক্রিয়া পর্যালোচনা</DialogTitle>
            </DialogHeader>
            
            {selectedResponse && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-bangla">
                    <strong>শিক্ষার্থী:</strong> {selectedResponse.students?.full_name_bn}
                  </p>
                  <p className="font-bangla">
                    <strong>তারিখ:</strong> {selectedResponse.attendance?.date && format(new Date(selectedResponse.attendance.date), 'dd MMMM yyyy', { locale: bn })}
                  </p>
                  <p className="font-bangla">
                    <strong>প্রতিক্রিয়া:</strong> {responseTypeLabels[selectedResponse.response_type]}
                  </p>
                  {selectedResponse.reason_category_bn && (
                    <p className="font-bangla">
                      <strong>কারণ:</strong> {selectedResponse.reason_category_bn}
                    </p>
                  )}
                  {selectedResponse.reason_text && (
                    <p className="font-bangla text-sm mt-2">{selectedResponse.reason_text}</p>
                  )}
                  {selectedResponse.correction_note && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="font-bangla text-sm text-yellow-700">{selectedResponse.correction_note}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium font-bangla">প্রশাসক মন্তব্য (ঐচ্ছিক)</label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="আপনার মন্তব্য লিখুন..."
                    className="mt-1 font-bangla"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate(selectedResponse?.id)}
                disabled={rejectMutation.isPending}
                className="font-bangla"
              >
                <XCircle className="w-4 h-4 mr-1" />
                প্রত্যাখ্যান
              </Button>
              <Button
                onClick={() => approveMutation.mutate(selectedResponse?.id)}
                disabled={approveMutation.isPending}
                className="font-bangla"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                অনুমোদন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
