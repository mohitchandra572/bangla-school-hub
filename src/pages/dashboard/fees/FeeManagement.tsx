import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Plus, DollarSign, AlertTriangle, CheckCircle, Clock, 
  CreditCard, Receipt, Download, Printer
} from 'lucide-react';

const feeTypes = ['টিউশন ফি', 'ভর্তি ফি', 'পরীক্ষা ফি', 'ল্যাব ফি', 'লাইব্রেরি ফি', 'পরিবহন ফি'];
const paymentMethods = ['নগদ', 'ব্যাংক', 'বিকাশ', 'নগদ (মোবাইল)', 'রকেট'];
const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];

export default function FeeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [showCollectDialog, setShowCollectDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [payment, setPayment] = useState({
    amount_paid: 0,
    payment_method: '',
    remarks: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fees, isLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fees')
        .select('*, students(full_name, full_name_bn, class, roll_number)')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['fee-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fees').select('amount, status');
      if (error) throw error;
      
      const total = data.reduce((sum, f) => sum + Number(f.amount), 0);
      const paid = data.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0);
      const pending = data.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0);
      const overdue = data.filter(f => f.status === 'overdue').reduce((sum, f) => sum + Number(f.amount), 0);
      
      return { total, paid, pending, overdue };
    },
  });

  const collectFeeMutation = useMutation({
    mutationFn: async () => {
      // Create receipt
      const receiptNumber = `RCP-${Date.now()}`;
      const { error: receiptError } = await supabase.from('fee_receipts').insert([{
        fee_id: selectedFee.id,
        receipt_number: receiptNumber,
        amount_paid: payment.amount_paid,
        payment_method: payment.payment_method,
        remarks: payment.remarks,
      }]);
      if (receiptError) throw receiptError;

      // Update fee status
      const { error: feeError } = await supabase
        .from('fees')
        .update({ 
          status: payment.amount_paid >= selectedFee.amount ? 'paid' : 'partial',
          paid_date: new Date().toISOString(),
          payment_method: payment.payment_method,
        })
        .eq('id', selectedFee.id);
      if (feeError) throw feeError;

      return receiptNumber;
    },
    onSuccess: (receiptNumber) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] });
      setShowCollectDialog(false);
      setSelectedFee(null);
      setPayment({ amount_paid: 0, payment_method: '', remarks: '' });
      toast({ title: 'সফল!', description: `ফি সংগৃহীত। রশিদ নং: ${receiptNumber}` });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const filteredFees = fees?.filter(fee => {
    const studentName = fee.students?.full_name_bn || fee.students?.full_name || '';
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || fee.status === filterStatus;
    const matchesClass = filterClass === 'all' || fee.students?.class === filterClass;
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500 font-bangla">পরিশোধিত</Badge>;
      case 'pending': return <Badge className="bg-yellow-500 font-bangla">বকেয়া</Badge>;
      case 'overdue': return <Badge className="bg-red-500 font-bangla">মেয়াদোত্তীর্ণ</Badge>;
      case 'partial': return <Badge className="bg-blue-500 font-bangla">আংশিক</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const openCollectDialog = (fee: any) => {
    setSelectedFee(fee);
    setPayment({ amount_paid: Number(fee.amount), payment_method: '', remarks: '' });
    setShowCollectDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">ফি ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground font-bangla">ফি সংগ্রহ, রশিদ ও প্রতিবেদন</p>
          </div>
          <Button className="font-bangla">
            <Plus className="w-4 h-4 mr-2" /> নতুন ফি যোগ
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট ফি</p>
                  <p className="text-xl font-bold">৳{stats?.total?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">সংগৃহীত</p>
                  <p className="text-xl font-bold text-green-600">৳{stats?.paid?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">বকেয়া</p>
                  <p className="text-xl font-bold text-yellow-600">৳{stats?.pending?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মেয়াদোত্তীর্ণ</p>
                  <p className="text-xl font-bold text-red-600">৳{stats?.overdue?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="শিক্ষার্থী খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-bangla"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40 font-bangla">
              <SelectValue placeholder="স্ট্যাটাস" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল</SelectItem>
              <SelectItem value="pending">বকেয়া</SelectItem>
              <SelectItem value="paid">পরিশোধিত</SelectItem>
              <SelectItem value="overdue">মেয়াদোত্তীর্ণ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-full md:w-40 font-bangla">
              <SelectValue placeholder="শ্রেণী" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল শ্রেণী</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Fees Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bangla">শিক্ষার্থী</TableHead>
                <TableHead className="font-bangla">শ্রেণী</TableHead>
                <TableHead className="font-bangla">ফির ধরন</TableHead>
                <TableHead className="font-bangla">পরিমাণ</TableHead>
                <TableHead className="font-bangla">শেষ তারিখ</TableHead>
                <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 font-bangla">লোড হচ্ছে...</TableCell>
                </TableRow>
              ) : filteredFees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-bangla">
                    কোনো ফি পাওয়া যায়নি
                  </TableCell>
                </TableRow>
              ) : (
                filteredFees?.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-bangla font-medium">
                      {fee.students?.full_name_bn || fee.students?.full_name}
                      <span className="block text-xs text-muted-foreground">রোল: {fee.students?.roll_number}</span>
                    </TableCell>
                    <TableCell className="font-bangla">{fee.students?.class}</TableCell>
                    <TableCell className="font-bangla">{fee.fee_type}</TableCell>
                    <TableCell className="font-semibold">৳{Number(fee.amount).toLocaleString()}</TableCell>
                    <TableCell className="font-bangla">
                      {new Date(fee.due_date).toLocaleDateString('bn-BD')}
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.status || 'pending')}</TableCell>
                    <TableCell className="text-right">
                      {fee.status !== 'paid' && (
                        <Button size="sm" onClick={() => openCollectDialog(fee)} className="font-bangla">
                          <CreditCard className="w-4 h-4 mr-1" /> সংগ্রহ
                        </Button>
                      )}
                      {fee.status === 'paid' && (
                        <Button size="sm" variant="outline" className="font-bangla">
                          <Receipt className="w-4 h-4 mr-1" /> রশিদ
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Collect Fee Dialog */}
        <Dialog open={showCollectDialog} onOpenChange={setShowCollectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-bangla">ফি সংগ্রহ</DialogTitle>
            </DialogHeader>
            {selectedFee && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-semibold font-bangla">{selectedFee.students?.full_name_bn}</p>
                  <p className="text-sm text-muted-foreground font-bangla">
                    {selectedFee.students?.class} শ্রেণী • রোল: {selectedFee.students?.roll_number}
                  </p>
                  <div className="mt-2 flex justify-between">
                    <span className="font-bangla">{selectedFee.fee_type}</span>
                    <span className="font-bold">৳{Number(selectedFee.amount).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <Label className="font-bangla">পরিশোধের পরিমাণ</Label>
                  <Input
                    type="number"
                    value={payment.amount_paid}
                    onChange={(e) => setPayment({ ...payment, amount_paid: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <Label className="font-bangla">পেমেন্ট মাধ্যম</Label>
                  <Select value={payment.payment_method} onValueChange={(v) => setPayment({ ...payment, payment_method: v })}>
                    <SelectTrigger className="font-bangla"><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-bangla">মন্তব্য (ঐচ্ছিক)</Label>
                  <Input
                    value={payment.remarks}
                    onChange={(e) => setPayment({ ...payment, remarks: e.target.value })}
                    placeholder="ট্রানজ্যাকশন আইডি বা অন্যান্য তথ্য"
                    className="font-bangla"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCollectDialog(false)} className="font-bangla">বাতিল</Button>
              <Button 
                onClick={() => collectFeeMutation.mutate()} 
                disabled={!payment.payment_method || payment.amount_paid <= 0}
                className="font-bangla"
              >
                <Receipt className="w-4 h-4 mr-2" /> রশিদ তৈরি করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
