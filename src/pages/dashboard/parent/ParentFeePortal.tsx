import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Download, CreditCard, Receipt, AlertTriangle, CheckCircle, 
  Clock, User, Wallet, Calendar, FileText, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'পরিশোধিত', icon: CheckCircle },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'বকেয়া', icon: Clock },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'মেয়াদোত্তীর্ণ', icon: AlertTriangle },
  partial: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'আংশিক', icon: Wallet },
};

const paymentMethods = [
  { id: 'bkash', name: 'বিকাশ', logo: '🟪', color: 'bg-pink-500' },
  { id: 'nagad', name: 'নগদ', logo: '🟧', color: 'bg-orange-500' },
  { id: 'rocket', name: 'রকেট', logo: '🟣', color: 'bg-purple-500' },
];

export default function ParentFeePortal() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dues');

  // Fetch parent's children
  const { data: children } = useQuery({
    queryKey: ['parent-children-fees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, full_name_bn, class, section, roll_number, photo_url')
        .eq('parent_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const currentChildId = selectedChildId || children?.[0]?.id;
  const currentChild = children?.find(c => c.id === currentChildId);

  // Fetch fees for selected child
  const { data: fees, isLoading } = useQuery({
    queryKey: ['parent-child-fees', currentChildId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', currentChildId)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentChildId,
  });

  // Fetch payment history
  const { data: payments } = useQuery({
    queryKey: ['parent-payments', currentChildId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_receipts')
        .select('*, fees(fee_type, amount)')
        .eq('fees.student_id', currentChildId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentChildId,
  });

  // Calculate summary
  const summary = {
    totalDue: fees?.filter(f => f.status !== 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    totalPaid: fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    overdueCount: fees?.filter(f => f.status === 'overdue').length || 0,
    pendingCount: fees?.filter(f => f.status === 'pending').length || 0,
  };

  const pendingFees = fees?.filter(f => f.status !== 'paid') || [];
  const paidFees = fees?.filter(f => f.status === 'paid') || [];

  const handleDownloadReceipt = (receiptId: string) => {
    // Would trigger PDF download
    console.log('Download receipt:', receiptId);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">ফি পেমেন্ট</h1>
            <p className="text-muted-foreground font-bangla">
              আপনার সন্তানের ফি বিবরণ ও পেমেন্ট
            </p>
          </div>
        </div>

        {/* Child Selector */}
        {children && children.length > 1 && (
          <Card>
            <CardContent className="p-4">
              <Select value={currentChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="সন্তান নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <span className="font-bangla">
                        {child.full_name_bn || child.full_name} - {child.class} ({child.roll_number})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Current Child Info */}
        {currentChild && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {currentChild.photo_url ? (
                      <img src={currentChild.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold font-bangla text-lg">
                      {currentChild.full_name_bn || currentChild.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-bangla">
                      {currentChild.class} শ্রেণি | রোল: {currentChild.roll_number}
                    </p>
                  </div>
                  {summary.totalDue > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground font-bangla">মোট বকেয়া</p>
                      <p className="text-xl font-bold text-destructive">৳{summary.totalDue.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <p className="text-xl font-bold text-red-700">৳{summary.totalDue.toLocaleString()}</p>
              <p className="text-sm text-red-600 font-bangla">মোট বকেয়া</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-xl font-bold text-green-700">৳{summary.totalPaid.toLocaleString()}</p>
              <p className="text-sm text-green-600 font-bangla">পরিশোধিত</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-xl font-bold text-yellow-700">{summary.pendingCount}</p>
              <p className="text-sm text-yellow-600 font-bangla">বকেয়া বিল</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-xl font-bold text-orange-700">{summary.overdueCount}</p>
              <p className="text-sm text-orange-600 font-bangla">মেয়াদোত্তীর্ণ</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Options (for pending dues) */}
        {summary.totalDue > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Smartphone className="w-5 h-5" /> অনলাইন পেমেন্ট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-bangla mb-4">
                মোবাইল ব্যাংকিং দিয়ে সহজেই পেমেন্ট করুন
              </p>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-muted"
                  >
                    <span className="text-3xl">{method.logo}</span>
                    <span className="font-bangla">{method.name}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-bangla mt-4 text-center">
                * অনলাইন পেমেন্ট শীঘ্রই আসছে। এখন স্কুল অফিসে নগদ/ব্যাংকে পরিশোধ করুন।
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="dues" className="flex-1 font-bangla">
              বকেয়া ({pendingFees.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex-1 font-bangla">
              পরিশোধিত ({paidFees.length})
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex-1 font-bangla">
              রশিদ
            </TabsTrigger>
          </TabsList>

          {/* Dues Tab */}
          <TabsContent value="dues" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : pendingFees.length === 0 ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-xl font-bold text-green-700 font-bangla">সব ফি পরিশোধিত!</h3>
                  <p className="text-green-600 font-bangla mt-2">কোনো বকেয়া নেই।</p>
                </CardContent>
              </Card>
            ) : (
              pendingFees.map((fee, index) => {
                const status = statusConfig[fee.status || 'pending'];
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={fee.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`border-l-4 ${fee.status === 'overdue' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
                              <StatusIcon className={`w-5 h-5 ${status.text}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold font-bangla">{fee.fee_type}</h4>
                              <p className="text-sm text-muted-foreground font-bangla">
                                শেষ তারিখ: {format(new Date(fee.due_date), 'dd MMMM yyyy', { locale: bn })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">৳{Number(fee.amount).toLocaleString()}</p>
                            <Badge className={`${status.bg} ${status.text}`}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Paid Tab */}
          <TabsContent value="paid" className="mt-4 space-y-3">
            {paidFees.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground font-bangla">
                  কোনো পরিশোধিত ফি নেই
                </CardContent>
              </Card>
            ) : (
              paidFees.map((fee, index) => (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold font-bangla">{fee.fee_type}</h4>
                            <p className="text-sm text-muted-foreground font-bangla">
                              পরিশোধ: {fee.paid_date && format(new Date(fee.paid_date), 'dd MMMM yyyy', { locale: bn })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-700">৳{Number(fee.amount).toLocaleString()}</p>
                          <Button size="sm" variant="ghost" className="font-bangla">
                            <Receipt className="w-4 h-4 mr-1" /> রশিদ
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="mt-4 space-y-3">
            {payments?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground font-bangla">
                  কোনো রশিদ নেই
                </CardContent>
              </Card>
            ) : (
              payments?.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold font-bangla">
                              রশিদ #{payment.receipt_number}
                            </h4>
                            <p className="text-sm text-muted-foreground font-bangla">
                              {payment.payment_date && format(new Date(payment.payment_date), 'dd MMMM yyyy', { locale: bn })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold">৳{Number(payment.amount_paid).toLocaleString()}</p>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(payment.id)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground font-bangla">
          <p>সমস্যা হলে স্কুল অফিসে যোগাযোগ করুন</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
