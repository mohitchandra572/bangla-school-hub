import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, CheckCircle, XCircle, FileText, User, 
  Calendar, GraduationCap, Shield, RefreshCw 
} from 'lucide-react';
import { format } from 'date-fns';

const CERTIFICATE_TYPE_LABELS: Record<string, { en: string; bn: string }> = {
  transfer_certificate: { en: 'Transfer Certificate', bn: 'স্থানান্তর সনদ' },
  testimonial: { en: 'Testimonial', bn: 'সাক্ষ্যপত্র' },
  character_certificate: { en: 'Character Certificate', bn: 'চরিত্র সনদ' },
  study_certificate: { en: 'Study Certificate', bn: 'অধ্যয়ন সনদ' },
  bonafide_certificate: { en: 'Bonafide Certificate', bn: 'বোনাফাইড সনদ' },
};

export default function CertificateVerify() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  const [verificationCode, setVerificationCode] = useState(codeFromUrl || '');
  const [searchedCode, setSearchedCode] = useState(codeFromUrl || '');

  // Fetch certificate by verification code
  const { data: certificate, isLoading, error, refetch } = useQuery({
    queryKey: ['verify-certificate', searchedCode],
    queryFn: async () => {
      if (!searchedCode) return null;
      
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('verification_code', searchedCode.toUpperCase())
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    enabled: !!searchedCode,
  });

  // Log verification
  const logVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!certificate) return;
      await supabase.from('certificate_verifications').insert({
        certificate_id: certificate.id,
        verification_code: searchedCode.toUpperCase(),
        is_valid: true,
      });
    },
  });

  const handleVerify = () => {
    setSearchedCode(verificationCode);
    if (certificate) {
      logVerificationMutation.mutate();
    }
  };

  const isValid = certificate?.status === 'issued';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold font-bangla">সার্টিফিকেট যাচাইকরণ</h1>
              <p className="text-sm text-muted-foreground">Certificate Verification Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-bangla">সার্টিফিকেট যাচাই করুন</CardTitle>
            <CardDescription className="font-bangla">
              সার্টিফিকেটের ভেরিফিকেশন কোড প্রবেশ করুন অথবা QR কোড স্ক্যান করুন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="যেমন: ABC123XYZ456"
                  className="pl-10 text-lg font-mono tracking-wider"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <Button 
                onClick={handleVerify} 
                disabled={!verificationCode || isLoading}
                className="font-bangla px-6"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'যাচাই করুন'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {searchedCode && (
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center py-12">
                  <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="font-bangla text-muted-foreground">যাচাই করা হচ্ছে...</p>
                </div>
              ) : certificate ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-lg flex items-center gap-4 ${
                    isValid 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-yellow-50 dark:bg-yellow-900/20'
                  }`}>
                    {isValid ? (
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-yellow-600" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                        {isValid ? 'সার্টিফিকেট বৈধ' : 'সার্টিফিকেট অপেক্ষমান'}
                      </h3>
                      <p className={`${isValid ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isValid ? 'Certificate is Valid & Issued' : `Status: ${certificate.status}`}
                      </p>
                    </div>
                    <Badge className="ml-auto" variant={isValid ? 'default' : 'secondary'}>
                      {CERTIFICATE_TYPE_LABELS[certificate.certificate_type]?.bn || certificate.certificate_type}
                    </Badge>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold font-bangla border-b pb-2">সার্টিফিকেট তথ্য</h4>
                      
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground font-bangla">সার্টিফিকেট নম্বর</p>
                          <p className="font-mono font-medium">{certificate.certificate_number}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground font-bangla">ইস্যুর তারিখ</p>
                          <p className="font-medium">
                            {certificate.issue_date && format(new Date(certificate.issue_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground font-bangla">ভেরিফিকেশন কোড</p>
                          <p className="font-mono font-medium">{certificate.verification_code}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold font-bangla border-b pb-2">শিক্ষার্থীর তথ্য</h4>
                      
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground font-bangla">নাম</p>
                          <p className="font-medium font-bangla">
                            {certificate.student_name_bn || certificate.student_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground font-bangla">শ্রেণি</p>
                          <p className="font-medium font-bangla">
                            {certificate.class} {certificate.section && `- ${certificate.section}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground font-bangla">পিতার নাম</p>
                          <p className="font-medium font-bangla">
                            {certificate.father_name_bn || certificate.father_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 bg-muted rounded-lg text-sm">
                    <p className="font-bangla text-muted-foreground">
                      <strong>নিরাপত্তা বিজ্ঞপ্তি:</strong> এই তথ্য শুধুমাত্র যাচাইকরণের উদ্দেশ্যে প্রদর্শিত। 
                      সার্টিফিকেটের বৈধতা সম্পর্কে কোনো প্রশ্ন থাকলে সরাসরি বিদ্যালয়ের সাথে যোগাযোগ করুন।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12">
                  <XCircle className="w-16 h-16 text-destructive mb-4" />
                  <h3 className="text-xl font-bold text-destructive font-bangla">সার্টিফিকেট পাওয়া যায়নি</h3>
                  <p className="text-muted-foreground font-bangla mt-2">
                    এই ভেরিফিকেশন কোডে কোনো সার্টিফিকেট নিবন্ধিত নেই
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No certificate found with this verification code
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!searchedCode && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold font-bangla mb-4">কিভাবে যাচাই করবেন?</h3>
              <ol className="space-y-3 font-bangla text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">১</span>
                  <span>সার্টিফিকেটে প্রদত্ত ভেরিফিকেশন কোড খুঁজুন (সাধারণত নিচে বা QR কোডের পাশে থাকে)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">২</span>
                  <span>উপরের বক্সে কোডটি প্রবেশ করুন এবং "যাচাই করুন" বাটনে ক্লিক করুন</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">৩</span>
                  <span>সার্টিফিকেটের বিস্তারিত তথ্য দেখুন এবং আসল সার্টিফিকেটের সাথে মিলিয়ে দেখুন</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>© ২০২৫ সর্বস্বত্ব সংরক্ষিত | Powered by School ERP</p>
        </div>
      </footer>
    </div>
  );
}
