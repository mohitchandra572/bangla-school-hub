import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  FileText, Download, CheckCircle2, XCircle, 
  Clock, Calendar, User, BookOpen
} from 'lucide-react';

export default function StudentAdmitCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch student info
  const { data: student } = useQuery({
    queryKey: ['student-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch admit cards
  const { data: admitCards, isLoading } = useQuery({
    queryKey: ['student-admit-cards', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admit_cards')
        .select('*, exams(id, name, name_bn, exam_type, start_date, end_date, class, section)')
        .eq('student_id', student?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (admitCardId: string) => {
      const { error } = await supabase
        .from('admit_cards')
        .update({
          is_downloaded: true,
          downloaded_at: new Date().toISOString()
        })
        .eq('id', admitCardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-admit-cards'] });
      toast.success('প্রবেশপত্র ডাউনলোড হচ্ছে...');
    }
  });

  const handleDownload = (admitCard: any) => {
    // Mark as downloaded
    downloadMutation.mutate(admitCard.id);
    
    // Generate print-friendly view
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>প্রবেশপত্র - ${admitCard.admit_number}</title>
          <style>
            body {
              font-family: 'SolaimanLipi', 'Kalpurush', sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 10px 0;
              font-size: 20px;
              color: #666;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
            }
            .info-item {
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .info-item label {
              font-weight: bold;
              display: block;
              margin-bottom: 5px;
              color: #666;
            }
            .exam-info {
              background: #e3f2fd;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .notice {
              border: 1px solid #ff9800;
              background: #fff3e0;
              padding: 15px;
              border-radius: 5px;
              margin-top: 30px;
            }
            .qr-code {
              text-align: center;
              margin-top: 30px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>আদর্শ বিদ্যালয়</h1>
            <h2>প্রবেশপত্র / ADMIT CARD</h2>
            <p>${admitCard.exams?.name_bn || admitCard.exams?.name}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>প্রবেশপত্র নম্বর</label>
              <span>${admitCard.admit_number}</span>
            </div>
            <div class="info-item">
              <label>শিক্ষার্থীর নাম</label>
              <span>${student?.full_name_bn || student?.full_name}</span>
            </div>
            <div class="info-item">
              <label>শ্রেণি ও শাখা</label>
              <span>${student?.class} ${student?.section || ''}</span>
            </div>
            <div class="info-item">
              <label>রোল নম্বর</label>
              <span>${student?.roll_number}</span>
            </div>
            <div class="info-item">
              <label>পিতার নাম</label>
              <span>${student?.father_name_bn || student?.father_name || '-'}</span>
            </div>
            <div class="info-item">
              <label>মাতার নাম</label>
              <span>${student?.mother_name_bn || student?.mother_name || '-'}</span>
            </div>
          </div>
          
          <div class="exam-info">
            <h3>পরীক্ষার তথ্য</h3>
            <p><strong>পরীক্ষার নাম:</strong> ${admitCard.exams?.name_bn || admitCard.exams?.name}</p>
            <p><strong>পরীক্ষার তারিখ:</strong> ${admitCard.exams?.start_date ? format(new Date(admitCard.exams.start_date), 'dd MMMM yyyy', { locale: bn }) : '-'} 
            ${admitCard.exams?.end_date ? ` - ${format(new Date(admitCard.exams.end_date), 'dd MMMM yyyy', { locale: bn })}` : ''}</p>
          </div>
          
          <div class="notice">
            <h4>গুরুত্বপূর্ণ নির্দেশনা:</h4>
            <ul>
              <li>পরীক্ষার হলে প্রবেশের ৩০ মিনিট পূর্বে উপস্থিত থাকতে হবে</li>
              <li>প্রবেশপত্র ছাড়া পরীক্ষায় অংশগ্রহণ করা যাবে না</li>
              <li>পরীক্ষার হলে মোবাইল ফোন আনা সম্পূর্ণ নিষেধ</li>
              <li>নির্ধারিত আসন ছাড়া অন্য কোথাও বসা যাবে না</li>
            </ul>
          </div>
          
          <div style="margin-top: 60px; display: flex; justify-content: space-between;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 10px; width: 150px;">
                শিক্ষার্থীর স্বাক্ষর
              </div>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 1px solid #333; padding-top: 10px; width: 150px;">
                প্রধান শিক্ষক
              </div>
            </div>
          </div>
          
          <button class="no-print" onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; cursor: pointer;">
            প্রিন্ট করুন
          </button>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getEligibilityBadge = (status: string | null) => {
    switch (status) {
      case 'eligible':
        return <Badge className="bg-green-500 font-bangla">যোগ্য</Badge>;
      case 'ineligible':
        return <Badge variant="destructive" className="font-bangla">অযোগ্য</Badge>;
      default:
        return <Badge variant="secondary" className="font-bangla">মূল্যায়ন অপেক্ষারত</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">প্রবেশপত্র</h1>
          <p className="text-muted-foreground font-bangla">আপনার পরীক্ষার প্রবেশপত্র ডাউনলোড করুন</p>
        </div>

        {/* Admit Cards List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : admitCards && admitCards.length > 0 ? (
          <div className="grid gap-4">
            {admitCards.map((admitCard: any) => (
              <Card key={admitCard.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-bangla text-lg">
                          {admitCard.exams?.name_bn || admitCard.exams?.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground font-bangla mt-1">
                          প্রবেশপত্র নম্বর: {admitCard.admit_number}
                        </p>
                      </div>
                    </div>
                    {getEligibilityBadge(admitCard.eligibility_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-bangla">
                        {admitCard.exams?.start_date 
                          ? format(new Date(admitCard.exams.start_date), 'dd MMM yyyy', { locale: bn })
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-bangla">
                        {admitCard.exams?.class} শ্রেণি
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {admitCard.fees_cleared ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-bangla ${admitCard.fees_cleared ? 'text-green-600' : 'text-red-600'}`}>
                        {admitCard.fees_cleared ? 'ফি পরিশোধিত' : 'ফি বকেয়া'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {admitCard.documents_complete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-bangla ${admitCard.documents_complete ? 'text-green-600' : 'text-red-600'}`}>
                        {admitCard.documents_complete ? 'ডকুমেন্ট সম্পূর্ণ' : 'ডকুমেন্ট অসম্পূর্ণ'}
                      </span>
                    </div>
                  </div>

                  {admitCard.eligibility_status === 'ineligible' && admitCard.eligibility_reason && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-bangla">
                      <strong>কারণ:</strong> {admitCard.eligibility_reason}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => handleDownload(admitCard)}
                      disabled={admitCard.eligibility_status !== 'eligible'}
                      className="font-bangla"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ডাউনলোড করুন
                    </Button>
                    {admitCard.is_downloaded && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-bangla">
                          ডাউনলোড করা হয়েছে: {format(new Date(admitCard.downloaded_at!), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-bangla">কোনো প্রবেশপত্র নেই</p>
              <p className="text-sm text-muted-foreground font-bangla mt-2">
                পরীক্ষার প্রবেশপত্র প্রকাশ হলে এখানে দেখা যাবে
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
