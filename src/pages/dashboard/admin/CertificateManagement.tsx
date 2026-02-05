import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, Download, Eye, Check, X, Clock, 
  Search, Filter, Plus, QrCode, Printer, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const CERTIFICATE_TYPES = [
  { value: 'transfer_certificate', label: 'Transfer Certificate (TC)', label_bn: 'স্থানান্তর সনদ' },
  { value: 'testimonial', label: 'Testimonial', label_bn: 'সাক্ষ্যপত্র' },
  { value: 'character_certificate', label: 'Character Certificate', label_bn: 'চরিত্র সনদ' },
  { value: 'study_certificate', label: 'Study Certificate', label_bn: 'অধ্যয়ন সনদ' },
  { value: 'bonafide_certificate', label: 'Bonafide Certificate', label_bn: 'বোনাফাইড সনদ' },
];

const STATUS_LABELS: Record<string, { label: string; label_bn: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', label_bn: 'খসড়া', variant: 'secondary' },
  pending_approval: { label: 'Pending', label_bn: 'অপেক্ষমান', variant: 'outline' },
  approved: { label: 'Approved', label_bn: 'অনুমোদিত', variant: 'default' },
  rejected: { label: 'Rejected', label_bn: 'প্রত্যাখ্যাত', variant: 'destructive' },
  issued: { label: 'Issued', label_bn: 'ইস্যু করা হয়েছে', variant: 'default' },
  cancelled: { label: 'Cancelled', label_bn: 'বাতিল', variant: 'destructive' },
};

export default function CertificateManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch certificates
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('certificates')
        .select(`
          *,
          students:student_id (full_name, full_name_bn, class, section, roll_number)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('certificate_type', typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Approve certificate
  const approveMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', certificateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({ title: 'সফল!', description: 'সার্টিফিকেট অনুমোদিত হয়েছে' });
    },
  });

  // Reject certificate
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('certificates')
        .update({
          status: 'rejected',
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({ title: 'সফল!', description: 'সার্টিফিকেট প্রত্যাখ্যাত হয়েছে' });
    },
  });

  // Issue certificate
  const issueMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .update({
          status: 'issued',
          issued_by: user?.id,
          issued_at: new Date().toISOString(),
        })
        .eq('id', certificateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast({ title: 'সফল!', description: 'সার্টিফিকেট ইস্যু করা হয়েছে' });
    },
  });

  const filteredCertificates = certificates?.filter((cert) =>
    cert.student_name_bn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCertificateTypeLabel = (type: string) => {
    return CERTIFICATE_TYPES.find(t => t.value === type)?.label_bn || type;
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_LABELS[status] || { label_bn: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label_bn}</Badge>;
  };

  const pendingCount = certificates?.filter(c => c.status === 'pending_approval').length || 0;
  const approvedCount = certificates?.filter(c => c.status === 'approved').length || 0;
  const issuedCount = certificates?.filter(c => c.status === 'issued').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">সার্টিফিকেট ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla">
              সার্টিফিকেট অনুমোদন, ইস্যু এবং ট্র্যাকিং
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground font-bangla">অপেক্ষমান</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground font-bangla">অনুমোদিত</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{issuedCount}</p>
                  <p className="text-sm text-muted-foreground font-bangla">ইস্যু করা</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <QrCode className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">মোট</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="শিক্ষার্থী বা সার্টিফিকেট নম্বর খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-bangla"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px] font-bangla">
                  <SelectValue placeholder="সার্টিফিকেট ধরন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব ধরন</SelectItem>
                  {CERTIFICATE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="font-bangla">
                      {type.label_bn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] font-bangla">
                  <SelectValue placeholder="স্ট্যাটাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব স্ট্যাটাস</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, info]) => (
                    <SelectItem key={value} value={value} className="font-bangla">
                      {info.label_bn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">সার্টিফিকেট তালিকা</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCertificates?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো সার্টিফিকেট পাওয়া যায়নি
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bangla">সার্টিফিকেট নং</TableHead>
                    <TableHead className="font-bangla">শিক্ষার্থী</TableHead>
                    <TableHead className="font-bangla">ধরন</TableHead>
                    <TableHead className="font-bangla">শ্রেণি</TableHead>
                    <TableHead className="font-bangla">তারিখ</TableHead>
                    <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                    <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates?.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-sm">
                        {cert.certificate_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium font-bangla">{cert.student_name_bn || cert.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            রোল: {cert.roll_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bangla">
                        {getCertificateTypeLabel(cert.certificate_type)}
                      </TableCell>
                      <TableCell className="font-bangla">
                        {cert.class} {cert.section && `- ${cert.section}`}
                      </TableCell>
                      <TableCell>
                        {cert.issue_date && format(new Date(cert.issue_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCertificate(cert);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {cert.status === 'pending_approval' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => approveMutation.mutate(cert.id)}
                                className="font-bangla"
                              >
                                <Check className="w-4 h-4 mr-1" /> অনুমোদন
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectMutation.mutate({ id: cert.id, reason: 'প্রত্যাখ্যাত' })}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {cert.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => issueMutation.mutate(cert.id)}
                              className="font-bangla"
                            >
                              <FileText className="w-4 h-4 mr-1" /> ইস্যু
                            </Button>
                          )}
                          {cert.status === 'issued' && (
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-bangla">সার্টিফিকেট প্রিভিউ</DialogTitle>
            </DialogHeader>
            {selectedCertificate && (
              <CertificatePreview certificate={selectedCertificate} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function CertificatePreview({ certificate }: { certificate: any }) {
  const getCertificateTitle = (type: string) => {
    const titles: Record<string, { en: string; bn: string }> = {
      transfer_certificate: { en: 'Transfer Certificate', bn: 'স্থানান্তর সনদপত্র' },
      testimonial: { en: 'Testimonial', bn: 'সাক্ষ্যপত্র' },
      character_certificate: { en: 'Character Certificate', bn: 'চরিত্র সনদপত্র' },
      study_certificate: { en: 'Study Certificate', bn: 'অধ্যয়ন সনদপত্র' },
      bonafide_certificate: { en: 'Bonafide Certificate', bn: 'বোনাফাইড সনদপত্র' },
    };
    return titles[type] || { en: type, bn: type };
  };

  const title = getCertificateTitle(certificate.certificate_type);

  return (
    <div className="bg-white p-8 border-2 border-dashed rounded-lg">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h2 className="text-xl font-bold font-bangla">বিদ্যালয়ের নাম</h2>
        <p className="text-sm text-muted-foreground">ঠিকানা, ফোন</p>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-bangla">{title.bn}</h1>
        <p className="text-lg">{title.en}</p>
        <p className="text-sm mt-2">
          সার্টিফিকেট নং: <span className="font-mono">{certificate.certificate_number}</span>
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4 font-bangla mb-8">
        <p>
          এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, <strong>{certificate.student_name_bn || certificate.student_name}</strong>,
          পিতা: <strong>{certificate.father_name_bn || certificate.father_name || 'N/A'}</strong>,
          মাতা: <strong>{certificate.mother_name_bn || certificate.mother_name || 'N/A'}</strong>,
          {' '}এই বিদ্যালয়ের <strong>{certificate.class}</strong> শ্রেণির
          {certificate.section && ` ${certificate.section} শাখার`} ছাত্র/ছাত্রী ছিল।
        </p>
        
        {certificate.certificate_type === 'transfer_certificate' && (
          <>
            <p>ভর্তির তারিখ: {certificate.admission_date || 'N/A'}</p>
            <p>ত্যাগের তারিখ: {certificate.leaving_date || 'N/A'}</p>
            <p>ত্যাগের কারণ: {certificate.reason_for_leaving_bn || certificate.reason_for_leaving || 'N/A'}</p>
            <p>আচরণ: {certificate.conduct_bn || certificate.conduct || 'ভালো'}</p>
          </>
        )}

        {certificate.certificate_type === 'character_certificate' && (
          <p>
            তার চরিত্র ও আচার-আচরণ সন্তোষজনক। আমার জানামতে সে কোনো রাজনৈতিক 
            বা অনৈতিক কার্যকলাপে জড়িত নয়।
          </p>
        )}

        <p className="mt-4">
          আমি তার উজ্জ্বল ভবিষ্যৎ কামনা করি।
        </p>
      </div>

      {/* Verification */}
      <div className="flex justify-between items-end mt-12">
        <div className="text-center">
          <div className="w-24 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center mb-2">
            <QrCode className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-xs font-mono">{certificate.verification_code}</p>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2 px-8">
            <p className="font-bangla">প্রধান শিক্ষক</p>
            <p className="text-sm text-muted-foreground">স্বাক্ষর ও সীল</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
        <p>ইস্যুর তারিখ: {certificate.issue_date && format(new Date(certificate.issue_date), 'dd/MM/yyyy')}</p>
        <p>এই সার্টিফিকেট যাচাই করতে QR কোড স্ক্যান করুন অথবা verification.school.edu.bd এ যান</p>
      </div>
    </div>
  );
}
