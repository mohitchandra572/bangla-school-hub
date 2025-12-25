import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  Plus, Search, Download, CreditCard, DollarSign, 
  AlertCircle, CheckCircle2, Clock, Receipt, Users, Filter
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const feeTypes = [
  { value: 'tuition', label: 'টিউশন ফি' },
  { value: 'admission', label: 'ভর্তি ফি' },
  { value: 'exam', label: 'পরীক্ষা ফি' },
  { value: 'library', label: 'লাইব্রেরি ফি' },
  { value: 'sports', label: 'খেলাধুলা ফি' },
  { value: 'lab', label: 'ল্যাব ফি' },
  { value: 'transport', label: 'পরিবহন ফি' },
  { value: 'other', label: 'অন্যান্য' },
];

const paymentMethods = [
  { value: 'cash', label: 'নগদ' },
  { value: 'bkash', label: 'বিকাশ' },
  { value: 'nagad', label: 'নগদ (মোবাইল)' },
  { value: 'bank', label: 'ব্যাংক ট্রান্সফার' },
  { value: 'cheque', label: 'চেক' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  paid: 'bg-green-500/10 text-green-600',
  overdue: 'bg-red-500/10 text-red-600',
  partial: 'bg-blue-500/10 text-blue-600',
};

const statusLabels: Record<string, string> = {
  pending: 'বকেয়া',
  paid: 'পরিশোধিত',
  overdue: 'মেয়াদোত্তীর্ণ',
  partial: 'আংশিক',
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function FeeManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [formData, setFormData] = useState({
    student_id: '',
    fee_type: 'tuition',
    amount: '',
    due_date: '',
    remarks: '',
  });

  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    transaction_id: '',
    remarks: '',
  });

  // Get user's school
  const { data: userSchool } = useQuery({
    queryKey: ['user-school', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('school_users')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch students for dropdown
  const { data: students } = useQuery({
    queryKey: ['students-for-fees', userSchool?.school_id],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select('id, full_name, full_name_bn, class, roll_number')
        .eq('status', 'active')
        .order('class');
      
      if (userSchool?.school_id) {
        query = query.eq('school_id', userSchool.school_id);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!userSchool?.school_id,
  });

  // Fetch fees
  const { data: fees, isLoading } = useQuery({
    queryKey: ['fees', searchTerm, statusFilter, typeFilter, userSchool?.school_id],
    queryFn: async () => {
      let query = supabase
        .from('fees')
        .select(`
          *,
          students:student_id (id, full_name, full_name_bn, class, roll_number)
        `)
        .order('due_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('fee_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search term
      let result = data || [];
      if (searchTerm) {
        result = result.filter(fee => 
          fee.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.students?.full_name_bn?.includes(searchTerm) ||
          fee.students?.roll_number?.includes(searchTerm)
        );
      }

      return result;
    },
  });

  // Stats
  const stats = {
    totalPending: fees?.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    totalPaid: fees?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    totalOverdue: fees?.filter(f => f.status === 'overdue').reduce((sum, f) => sum + Number(f.amount), 0) || 0,
    pendingCount: fees?.filter(f => f.status === 'pending').length || 0,
  };

  const pieData = [
    { name: 'পরিশোধিত', value: stats.totalPaid },
    { name: 'বকেয়া', value: stats.totalPending },
    { name: 'মেয়াদোত্তীর্ণ', value: stats.totalOverdue },
  ].filter(d => d.value > 0);

  // Create fee mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('fees').insert([{
        student_id: data.student_id,
        fee_type: data.fee_type,
        amount: parseFloat(data.amount),
        due_date: data.due_date,
        remarks: data.remarks || null,
        status: 'pending',
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('ফি সফলভাবে যোগ হয়েছে');
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'ফি যোগ করতে সমস্যা হয়েছে');
    },
  });

  // Record payment mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ feeId, data }: { feeId: string; data: typeof paymentData }) => {
      const { error } = await supabase.from('fees').update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: data.payment_method,
        transaction_id: data.transaction_id || null,
        remarks: data.remarks || null,
      }).eq('id', feeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('পেমেন্ট সফলভাবে রেকর্ড হয়েছে');
      setIsPaymentOpen(false);
      setSelectedFee(null);
      setPaymentData({ payment_method: 'cash', transaction_id: '', remarks: '' });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      fee_type: 'tuition',
      amount: '',
      due_date: '',
      remarks: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFee) {
      paymentMutation.mutate({ feeId: selectedFee.id, data: paymentData });
    }
  };

  const openPaymentDialog = (fee: any) => {
    setSelectedFee(fee);
    setIsPaymentOpen(true);
  };

  const getFeeTypeLabel = (type: string) => {
    return feeTypes.find(t => t.value === type)?.label || type;
  };

  const exportToCSV = () => {
    if (!fees?.length) return;
    const headers = ['শিক্ষার্থী', 'ক্লাস', 'রোল', 'ফি ধরন', 'পরিমাণ', 'নির্ধারিত তারিখ', 'অবস্থা'];
    const rows = fees.map(f => [
      f.students?.full_name_bn || f.students?.full_name,
      f.students?.class,
      f.students?.roll_number,
      getFeeTypeLabel(f.fee_type),
      f.amount,
      format(new Date(f.due_date), 'dd/MM/yyyy'),
      statusLabels[f.status || 'pending'],
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('ফি রিপোর্ট এক্সপোর্ট হয়েছে');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">ফি ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              ফি সংগ্রহ ও পেমেন্ট পরিচালনা করুন
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              <span className="font-bangla">এক্সপোর্ট</span>
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="font-bangla">নতুন ফি যোগ</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-bangla">নতুন ফি যোগ করুন</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="font-bangla">শিক্ষার্থী</Label>
                    <Select value={formData.student_id} onValueChange={(v) => setFormData({...formData, student_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="শিক্ষার্থী নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name_bn || student.full_name} ({student.class} - {student.roll_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bangla">ফি ধরন</Label>
                      <Select value={formData.fee_type} onValueChange={(v) => setFormData({...formData, fee_type: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {feeTypes.map(type => (
                            <SelectItem key={type.value} value={type.value} className="font-bangla">
                              {type.label}
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
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-bangla">নির্ধারিত তারিখ</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">মন্তব্য (ঐচ্ছিক)</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      className="font-bangla"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      <span className="font-bangla">বাতিল</span>
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      <span className="font-bangla">যোগ করুন</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">পরিশোধিত</p>
                  <p className="text-2xl font-bold">৳{stats.totalPaid.toLocaleString('bn-BD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">বকেয়া</p>
                  <p className="text-2xl font-bold">৳{stats.totalPending.toLocaleString('bn-BD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মেয়াদোত্তীর্ণ</p>
                  <p className="text-2xl font-bold">৳{stats.totalOverdue.toLocaleString('bn-BD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">বকেয়া শিক্ষার্থী</p>
                  <p className="text-2xl font-bold">{stats.pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart & Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-bangla">ফি সংগ্রহ অবস্থা</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `৳${value.toLocaleString('bn-BD')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground font-bangla">
                  কোনো ডেটা নেই
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-bangla">ফিল্টার</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="শিক্ষার্থী খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-bangla"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="অবস্থা" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-bangla">সব অবস্থা</SelectItem>
                    <SelectItem value="pending" className="font-bangla">বকেয়া</SelectItem>
                    <SelectItem value="paid" className="font-bangla">পরিশোধিত</SelectItem>
                    <SelectItem value="overdue" className="font-bangla">মেয়াদোত্তীর্ণ</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ফি ধরন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-bangla">সব ধরন</SelectItem>
                    {feeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value} className="font-bangla">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fees Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">ফি তালিকা</CardTitle>
            <CardDescription className="font-bangla">
              মোট {fees?.length || 0}টি রেকর্ড
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : fees?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো ফি রেকর্ড পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">শিক্ষার্থী</TableHead>
                      <TableHead className="font-bangla">ক্লাস</TableHead>
                      <TableHead className="font-bangla">ফি ধরন</TableHead>
                      <TableHead className="font-bangla">পরিমাণ</TableHead>
                      <TableHead className="font-bangla">নির্ধারিত তারিখ</TableHead>
                      <TableHead className="font-bangla">অবস্থা</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees?.map((fee: any) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium font-bangla">
                              {fee.students?.full_name_bn || fee.students?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              রোল: {fee.students?.roll_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bangla">{fee.students?.class}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bangla">
                            {getFeeTypeLabel(fee.fee_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{Number(fee.amount).toLocaleString('bn-BD')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(fee.due_date), 'dd MMM yyyy', { locale: bn })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[fee.status || 'pending']}>
                            {statusLabels[fee.status || 'pending']}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {fee.status !== 'paid' && (
                            <Button 
                              size="sm" 
                              onClick={() => openPaymentDialog(fee)}
                            >
                              <Receipt className="w-4 h-4 mr-1" />
                              <span className="font-bangla">পেমেন্ট</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-bangla">পেমেন্ট রেকর্ড করুন</DialogTitle>
              <DialogDescription className="font-bangla">
                {selectedFee?.students?.full_name_bn || selectedFee?.students?.full_name} - ৳{selectedFee?.amount}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <Label className="font-bangla">পেমেন্ট মেথড</Label>
                <Select 
                  value={paymentData.payment_method} 
                  onValueChange={(v) => setPaymentData({...paymentData, payment_method: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value} className="font-bangla">
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bangla">ট্রান্সাকশন আইডি (ঐচ্ছিক)</Label>
                <Input
                  value={paymentData.transaction_id}
                  onChange={(e) => setPaymentData({...paymentData, transaction_id: e.target.value})}
                  placeholder="বিকাশ/নগদ ট্রান্সাকশন আইডি"
                />
              </div>
              <div>
                <Label className="font-bangla">মন্তব্য (ঐচ্ছিক)</Label>
                <Textarea
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
                  className="font-bangla"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  <span className="font-bangla">বাতিল</span>
                </Button>
                <Button type="submit" disabled={paymentMutation.isPending}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span className="font-bangla">পেমেন্ট নিশ্চিত</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}