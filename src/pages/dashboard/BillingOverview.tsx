import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { bn } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, CreditCard, AlertCircle, 
  Download, Plus, Search, Filter, RefreshCw,
  Building2, Calendar, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const planColors: Record<string, string> = {
  basic: '#94a3b8',
  standard: '#3b82f6',
  premium: '#8b5cf6',
  enterprise: '#f59e0b',
};

const planNames: Record<string, string> = {
  basic: 'বেসিক',
  standard: 'স্ট্যান্ডার্ড',
  premium: 'প্রিমিয়াম',
  enterprise: 'এন্টারপ্রাইজ',
};

const paymentMethods: Record<string, string> = {
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  bank: 'ব্যাংক ট্রান্সফার',
  cash: 'নগদ',
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-600',
  pending: 'bg-yellow-500/10 text-yellow-600',
  failed: 'bg-red-500/10 text-red-600',
  refunded: 'bg-blue-500/10 text-blue-600',
};

const statusNames: Record<string, string> = {
  completed: 'সম্পন্ন',
  pending: 'অপেক্ষমাণ',
  failed: 'ব্যর্থ',
  refunded: 'ফেরত',
};

interface PaymentFormData {
  school_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  period_start: string;
  period_end: string;
  status: string;
  notes: string;
}

export default function BillingOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    school_id: '',
    amount: 0,
    payment_method: 'bkash',
    transaction_id: '',
    period_start: '',
    period_end: '',
    status: 'completed',
    notes: '',
  });

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['school-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_payments')
        .select(`
          *,
          schools:school_id (id, name, name_bn, subscription_plan)
        `)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch schools for dropdown
  const { data: schools } = useQuery({
    queryKey: ['schools-for-billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, name_bn, subscription_plan')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch subscription plans
  const { data: subscriptionPlans } = useQuery({
    queryKey: ['subscription-plans-billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate revenue statistics
  const revenueStats = {
    totalRevenue: payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    thisMonthRevenue: payments?.filter(p => {
      const paymentDate = new Date(p.payment_date);
      const now = new Date();
      return p.status === 'completed' && 
        paymentDate >= startOfMonth(now) && 
        paymentDate <= endOfMonth(now);
    }).reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    pendingPayments: payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    activeSubscriptions: schools?.filter(s => s.subscription_plan !== 'basic').length || 0,
  };

  // Monthly revenue data for chart
  const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const revenue = payments?.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return p.status === 'completed' && paymentDate >= monthStart && paymentDate <= monthEnd;
    }).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return {
      month: format(monthDate, 'MMM', { locale: bn }),
      revenue: revenue,
    };
  });

  // Plan distribution data
  const planDistribution = subscriptionPlans?.map(plan => ({
    name: planNames[plan.name] || plan.name,
    value: schools?.filter(s => s.subscription_plan === plan.name).length || 0,
    color: planColors[plan.name] || '#6b7280',
  })).filter(p => p.value > 0) || [];

  // Payment method distribution
  const methodDistribution = ['bkash', 'nagad', 'bank', 'cash'].map(method => ({
    name: paymentMethods[method],
    value: payments?.filter(p => p.payment_method === method && p.status === 'completed').length || 0,
  })).filter(m => m.value > 0);

  // Expected monthly revenue based on active subscriptions
  const expectedMonthlyRevenue = schools?.reduce((sum, school) => {
    const plan = subscriptionPlans?.find(p => p.name === school.subscription_plan);
    return sum + (plan?.price_monthly || 0);
  }, 0) || 0;

  // Filter payments
  const filteredPayments = payments?.filter(payment => {
    const schoolName = payment.schools?.name_bn || payment.schools?.name || '';
    const matchesSearch = schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  }) || [];

  // Add payment handler
  const handleAddPayment = async () => {
    try {
      const { error } = await supabase
        .from('school_payments')
        .insert({
          school_id: formData.school_id,
          amount: formData.amount,
          payment_method: formData.payment_method,
          transaction_id: formData.transaction_id || null,
          period_start: formData.period_start,
          period_end: formData.period_end,
          status: formData.status,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast.success('পেমেন্ট সফলভাবে যোগ করা হয়েছে');
      setIsAddDialogOpen(false);
      setFormData({
        school_id: '',
        amount: 0,
        payment_method: 'bkash',
        transaction_id: '',
        period_start: '',
        period_end: '',
        status: 'completed',
        notes: '',
      });
      refetchPayments();
    } catch (error: any) {
      toast.error('পেমেন্ট যোগ করতে সমস্যা হয়েছে');
      console.error(error);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = filteredPayments.map(p => ({
      'স্কুল': p.schools?.name_bn || p.schools?.name,
      'পরিমাণ': p.amount,
      'পেমেন্ট মেথড': paymentMethods[p.payment_method || ''] || p.payment_method,
      'ট্রান্সাকশন আইডি': p.transaction_id,
      'তারিখ': format(new Date(p.payment_date), 'dd/MM/yyyy'),
      'অবস্থা': statusNames[p.status || ''] || p.status,
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `billing_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('ডেটা এক্সপোর্ট হয়েছে');
  };

  const StatCard = ({ icon: Icon, label, value, subValue, trend, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-bangla">{label}</p>
              <p className="text-2xl font-bold mt-1">৳{value.toLocaleString('bn-BD')}</p>
              {subValue && (
                <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">বিলিং ওভারভিউ</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              রেভিনিউ, পেমেন্ট এবং সাবস্ক্রিপশন বিশ্লেষণ
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetchPayments()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="font-bangla">রিফ্রেশ</span>
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              <span className="font-bangla">এক্সপোর্ট</span>
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="font-bangla">পেমেন্ট যোগ করুন</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-bangla">নতুন পেমেন্ট যোগ করুন</DialogTitle>
                  <DialogDescription className="font-bangla">
                    স্কুলের সাবস্ক্রিপশন পেমেন্ট রেকর্ড করুন
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="font-bangla">স্কুল</Label>
                    <Select value={formData.school_id} onValueChange={(v) => setFormData({...formData, school_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="স্কুল নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools?.map(school => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name_bn || school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">পরিমাণ (টাকা)</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">পেমেন্ট মেথড</Label>
                    <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bkash">বিকাশ</SelectItem>
                        <SelectItem value="nagad">নগদ</SelectItem>
                        <SelectItem value="bank">ব্যাংক ট্রান্সফার</SelectItem>
                        <SelectItem value="cash">নগদ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">ট্রান্সাকশন আইডি</Label>
                    <Input
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                      placeholder="ঐচ্ছিক"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla">সময়কাল শুরু</Label>
                      <Input
                        type="date"
                        value={formData.period_start}
                        onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="font-bangla">সময়কাল শেষ</Label>
                      <Input
                        type="date"
                        value={formData.period_end}
                        onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-bangla">অবস্থা</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">সম্পন্ন</SelectItem>
                        <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
                        <SelectItem value="failed">ব্যর্থ</SelectItem>
                        <SelectItem value="refunded">ফেরত</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">নোট</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="ঐচ্ছিক"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    <span className="font-bangla">বাতিল</span>
                  </Button>
                  <Button onClick={handleAddPayment} disabled={!formData.school_id || !formData.amount || !formData.period_start || !formData.period_end}>
                    <span className="font-bangla">যোগ করুন</span>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="মোট রেভিনিউ"
            value={revenueStats.totalRevenue}
            color="bg-green-500/10 text-green-600"
          />
          <StatCard
            icon={Calendar}
            label="এই মাসের রেভিনিউ"
            value={revenueStats.thisMonthRevenue}
            color="bg-blue-500/10 text-blue-600"
          />
          <StatCard
            icon={Clock}
            label="অপেক্ষমাণ পেমেন্ট"
            value={revenueStats.pendingPayments}
            color="bg-yellow-500/10 text-yellow-600"
          />
          <StatCard
            icon={CreditCard}
            label="প্রত্যাশিত মাসিক রেভিনিউ"
            value={expectedMonthlyRevenue}
            subValue={`${revenueStats.activeSubscriptions} সক্রিয় সাবস্ক্রিপশন`}
            color="bg-purple-500/10 text-purple-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">মাসিক রেভিনিউ ট্রেন্ড</CardTitle>
              <CardDescription className="font-bangla">গত ৬ মাসের রেভিনিউ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`৳${value.toLocaleString('bn-BD')}`, 'রেভিনিউ']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla">প্ল্যান বিতরণ</CardTitle>
              <CardDescription className="font-bangla">স্কুলের সাবস্ক্রিপশন প্ল্যান অনুযায়ী</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">পেমেন্ট মেথড বিশ্লেষণ</CardTitle>
            <CardDescription className="font-bangla">পেমেন্ট মেথড অনুযায়ী সফল লেনদেন</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={methodDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="font-bangla">সাম্প্রতিক লেনদেন</CardTitle>
                <CardDescription className="font-bangla">সকল পেমেন্ট রেকর্ড</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="অবস্থা" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব অবস্থা</SelectItem>
                    <SelectItem value="completed">সম্পন্ন</SelectItem>
                    <SelectItem value="pending">অপেক্ষমাণ</SelectItem>
                    <SelectItem value="failed">ব্যর্থ</SelectItem>
                    <SelectItem value="refunded">ফেরত</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="পেমেন্ট মেথড" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব মেথড</SelectItem>
                    <SelectItem value="bkash">বিকাশ</SelectItem>
                    <SelectItem value="nagad">নগদ</SelectItem>
                    <SelectItem value="bank">ব্যাংক</SelectItem>
                    <SelectItem value="cash">নগদ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো লেনদেন পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">স্কুল</TableHead>
                      <TableHead className="font-bangla">পরিমাণ</TableHead>
                      <TableHead className="font-bangla">মেথড</TableHead>
                      <TableHead className="font-bangla">ট্রান্সাকশন আইডি</TableHead>
                      <TableHead className="font-bangla">সময়কাল</TableHead>
                      <TableHead className="font-bangla">তারিখ</TableHead>
                      <TableHead className="font-bangla">অবস্থা</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {payment.schools?.name_bn || payment.schools?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{Number(payment.amount).toLocaleString('bn-BD')}
                        </TableCell>
                        <TableCell>
                          {paymentMethods[payment.payment_method || ''] || payment.payment_method}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_id || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(payment.period_start), 'dd/MM/yy')} - {format(new Date(payment.period_end), 'dd/MM/yy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: bn })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[payment.status || 'pending']}>
                            {payment.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {payment.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {payment.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {statusNames[payment.status || ''] || payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments Alert */}
        {revenueStats.pendingPayments > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold font-bangla">অপেক্ষমাণ পেমেন্ট সতর্কতা</h4>
                  <p className="text-sm text-muted-foreground font-bangla">
                    ৳{revenueStats.pendingPayments.toLocaleString('bn-BD')} পরিমাণ পেমেন্ট অপেক্ষমাণ আছে
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('pending')}>
                  <span className="font-bangla">দেখুন</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}