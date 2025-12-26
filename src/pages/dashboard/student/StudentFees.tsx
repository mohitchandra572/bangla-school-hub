import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  CreditCard, Receipt, Clock, CheckCircle2, 
  AlertCircle, Download, Calendar, TrendingUp
} from 'lucide-react';

export default function StudentFees() {
  const { user } = useAuth();

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

  // Fetch fee invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['student-invoices', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_invoices')
        .select(`
          *,
          fee_invoice_items(*)
        `)
        .eq('student_id', student?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  // Fetch payment transactions
  const { data: transactions } = useQuery({
    queryKey: ['student-transactions', student?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('student_id', student?.id)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  // Calculate totals
  const pendingInvoices = invoices?.filter(i => ['pending', 'partial', 'overdue'].includes(i.status || '')) || [];
  const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
  const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.balance_amount || 0), 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 font-bangla">পরিশোধিত</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500 font-bangla">আংশিক</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="font-bangla">অতিরিক্ত বকেয়া</Badge>;
      default:
        return <Badge variant="outline" className="font-bangla">বকেয়া</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const methods: Record<string, string> = {
      'cash': 'নগদ',
      'bkash': 'বিকাশ',
      'nagad': 'নগদ (ডিজিটাল)',
      'bank': 'ব্যাংক ট্রান্সফার',
      'cheque': 'চেক'
    };
    return methods[method || ''] || method || '-';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">ফি ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground font-bangla">আপনার সকল ফি ও পেমেন্ট তথ্য</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট বকেয়া</p>
                  <p className="text-2xl font-bold text-red-600">
                    ৳{totalPending.toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট পরিশোধিত</p>
                  <p className="text-2xl font-bold text-green-600">
                    ৳{totalPaid.toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট ইনভয়েস</p>
                  <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="font-bangla">
            <TabsTrigger value="pending">বকেয়া ফি ({pendingInvoices.length})</TabsTrigger>
            <TabsTrigger value="paid">পরিশোধিত ({paidInvoices.length})</TabsTrigger>
            <TabsTrigger value="transactions">লেনদেন ({transactions?.length || 0})</TabsTrigger>
          </TabsList>

          {/* Pending Invoices */}
          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingInvoices.length > 0 ? (
              <div className="space-y-4">
                {pendingInvoices.map((invoice: any) => (
                  <Card key={invoice.id}>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bangla">
                            {invoice.month || invoice.academic_year}
                          </CardTitle>
                          <CardDescription className="font-bangla">
                            ইনভয়েস #{invoice.invoice_number}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(invoice.status)}
                          <p className="text-xl font-bold text-red-600">
                            ৳{(invoice.balance_amount || 0).toLocaleString('bn-BD')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground font-bangla">মোট ফি</p>
                          <p className="font-medium">৳{(invoice.total_amount || 0).toLocaleString('bn-BD')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-bangla">পরিশোধিত</p>
                          <p className="font-medium text-green-600">৳{(invoice.paid_amount || 0).toLocaleString('bn-BD')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-bangla">ছাড়</p>
                          <p className="font-medium">৳{(invoice.discount_amount || 0).toLocaleString('bn-BD')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground font-bangla">পরিশোধের শেষ তারিখ</p>
                            <p className="font-medium">{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                      </div>

                      {invoice.fee_invoice_items && invoice.fee_invoice_items.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium font-bangla mb-2">ফি বিবরণ:</h4>
                          <div className="space-y-1">
                            {invoice.fee_invoice_items.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="font-bangla">{item.description_bn || item.description}</span>
                                <span>৳{item.net_amount?.toLocaleString('bn-BD') || item.amount?.toLocaleString('bn-BD')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-bangla font-medium">সকল ফি পরিশোধিত!</p>
                  <p className="text-sm text-muted-foreground font-bangla mt-2">
                    আপনার কোনো বকেয়া ফি নেই
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Paid Invoices */}
          <TabsContent value="paid">
            {paidInvoices.length > 0 ? (
              <div className="space-y-4">
                {paidInvoices.map((invoice: any) => (
                  <Card key={invoice.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium font-bangla">{invoice.month || invoice.academic_year}</p>
                            <p className="text-sm text-muted-foreground">
                              ইনভয়েস #{invoice.invoice_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ৳{(invoice.paid_amount || 0).toLocaleString('bn-BD')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.updated_at!), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো পরিশোধিত ইনভয়েস নেই</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions">
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((txn: any) => (
                  <Card key={txn.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">#{txn.transaction_number}</p>
                            <p className="text-sm text-muted-foreground font-bangla">
                              {getPaymentMethodLabel(txn.payment_method)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ৳{txn.amount.toLocaleString('bn-BD')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(txn.payment_date!), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো লেনদেন নেই</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
