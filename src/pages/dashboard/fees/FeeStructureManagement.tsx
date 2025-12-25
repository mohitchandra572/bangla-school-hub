import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Edit, Trash2, DollarSign, Tag, Percent, Users, 
  Calendar, BookOpen, GraduationCap, Settings
} from 'lucide-react';

const classes = ['প্লে', 'নার্সারি', 'কেজি', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম', 'একাদশ', 'দ্বাদশ'];
const groups = ['সকল', 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা'];
const academicYears = ['2024', '2025', '2026'];

export default function FeeStructureManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('structures');
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);

  const [structureForm, setStructureForm] = useState({
    name: '',
    name_bn: '',
    fee_type: 'tuition',
    class: '',
    academic_year: '2025',
    amount: '',
    is_active: true,
  });

  const [discountForm, setDiscountForm] = useState({
    name: '',
    name_bn: '',
    discount_type: 'percentage',
    discount_value: '',
    criteria: 'scholarship',
    academic_year: '2025',
    is_active: true,
  });

  // Fetch fee categories
  const { data: categories } = useQuery({
    queryKey: ['fee-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch fee structures
  const { data: structures, isLoading: loadingStructures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .order('class');
      if (error) throw error;
      return data;
    },
  });

  // Fetch discounts
  const { data: discounts, isLoading: loadingDiscounts } = useQuery({
    queryKey: ['fee-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_discounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create/Update structure mutation
  const structureMutation = useMutation({
    mutationFn: async (data: typeof structureForm) => {
      if (editingStructure) {
        const { error } = await supabase
          .from('fee_structures')
          .update({
            name: data.name,
            name_bn: data.name_bn,
            fee_type: data.fee_type,
            class: data.class || null,
            academic_year: data.academic_year,
            amount: parseFloat(data.amount),
            is_active: data.is_active,
          })
          .eq('id', editingStructure.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fee_structures').insert([{
          name: data.name,
          name_bn: data.name_bn,
          fee_type: data.fee_type,
          class: data.class || null,
          academic_year: data.academic_year,
          amount: parseFloat(data.amount),
          is_active: data.is_active,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setShowStructureDialog(false);
      setEditingStructure(null);
      resetStructureForm();
      toast({ title: 'সফল!', description: editingStructure ? 'ফি কাঠামো আপডেট হয়েছে' : 'ফি কাঠামো যোগ হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  // Create/Update discount mutation
  const discountMutation = useMutation({
    mutationFn: async (data: typeof discountForm) => {
      if (editingDiscount) {
        const { error } = await supabase
          .from('fee_discounts')
          .update({
            name: data.name,
            name_bn: data.name_bn,
            discount_type: data.discount_type,
            discount_value: parseFloat(data.discount_value),
            criteria: data.criteria,
            academic_year: data.academic_year,
            is_active: data.is_active,
          })
          .eq('id', editingDiscount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fee_discounts').insert([{
          name: data.name,
          name_bn: data.name_bn,
          discount_type: data.discount_type,
          discount_value: parseFloat(data.discount_value),
          criteria: data.criteria,
          academic_year: data.academic_year,
          is_active: data.is_active,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-discounts'] });
      setShowDiscountDialog(false);
      setEditingDiscount(null);
      resetDiscountForm();
      toast({ title: 'সফল!', description: editingDiscount ? 'ছাড় আপডেট হয়েছে' : 'ছাড় যোগ হয়েছে' });
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const resetStructureForm = () => {
    setStructureForm({
      name: '', name_bn: '', fee_type: 'tuition', class: '', 
      academic_year: '2025', amount: '', is_active: true,
    });
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      name: '', name_bn: '', discount_type: 'percentage', discount_value: '',
      criteria: 'scholarship', academic_year: '2025', is_active: true,
    });
  };

  const openEditStructure = (structure: any) => {
    setEditingStructure(structure);
    setStructureForm({
      name: structure.name,
      name_bn: structure.name_bn || '',
      fee_type: structure.fee_type,
      class: structure.class || '',
      academic_year: structure.academic_year || '2025',
      amount: String(structure.amount),
      is_active: structure.is_active,
    });
    setShowStructureDialog(true);
  };

  const openEditDiscount = (discount: any) => {
    setEditingDiscount(discount);
    setDiscountForm({
      name: discount.name,
      name_bn: discount.name_bn || '',
      discount_type: discount.discount_type,
      discount_value: String(discount.discount_value),
      criteria: discount.criteria || 'scholarship',
      academic_year: discount.academic_year || '2025',
      is_active: discount.is_active,
    });
    setShowDiscountDialog(true);
  };

  const criteriaLabels: Record<string, string> = {
    scholarship: 'বৃত্তি',
    sibling: 'ভাই/বোন ছাড়',
    staff_child: 'কর্মচারী সন্তান',
    merit: 'মেধা ভিত্তিক',
    need_based: 'প্রয়োজন ভিত্তিক',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">ফি কাঠামো সেটআপ</h1>
            <p className="text-muted-foreground font-bangla">
              শ্রেণী ও বছর অনুযায়ী ফি কাঠামো ও ছাড় কনফিগার করুন
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bangla">ফি কাঠামো</p>
                <p className="text-xl font-bold">{structures?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bangla">ফি ক্যাটাগরি</p>
                <p className="text-xl font-bold">{categories?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bangla">ছাড় স্কিম</p>
                <p className="text-xl font-bold">{discounts?.filter(d => d.is_active).length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bangla">শ্রেণী</p>
                <p className="text-xl font-bold">{classes.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="structures" className="font-bangla">
              <DollarSign className="w-4 h-4 mr-2" /> ফি কাঠামো
            </TabsTrigger>
            <TabsTrigger value="categories" className="font-bangla">
              <Tag className="w-4 h-4 mr-2" /> ক্যাটাগরি
            </TabsTrigger>
            <TabsTrigger value="discounts" className="font-bangla">
              <Percent className="w-4 h-4 mr-2" /> ছাড় ও বৃত্তি
            </TabsTrigger>
          </TabsList>

          {/* Fee Structures Tab */}
          <TabsContent value="structures" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-bangla">ফি কাঠামো তালিকা</CardTitle>
                <Button onClick={() => { resetStructureForm(); setShowStructureDialog(true); }} className="font-bangla">
                  <Plus className="w-4 h-4 mr-2" /> নতুন যোগ
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">ফি নাম</TableHead>
                      <TableHead className="font-bangla">ধরন</TableHead>
                      <TableHead className="font-bangla">শ্রেণী</TableHead>
                      <TableHead className="font-bangla">শিক্ষাবর্ষ</TableHead>
                      <TableHead className="font-bangla">পরিমাণ</TableHead>
                      <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStructures ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 font-bangla">লোড হচ্ছে...</TableCell>
                      </TableRow>
                    ) : structures?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-bangla">
                          কোনো ফি কাঠামো নেই
                        </TableCell>
                      </TableRow>
                    ) : (
                      structures?.map((structure) => (
                        <TableRow key={structure.id}>
                          <TableCell className="font-bangla font-medium">
                            {structure.name_bn || structure.name}
                          </TableCell>
                          <TableCell className="font-bangla">{structure.fee_type}</TableCell>
                          <TableCell className="font-bangla">{structure.class || 'সকল'}</TableCell>
                          <TableCell>{structure.academic_year}</TableCell>
                          <TableCell className="font-semibold">৳{Number(structure.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={structure.is_active ? 'default' : 'secondary'}>
                              {structure.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openEditStructure(structure)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">ফি ক্যাটাগরি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories?.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold font-bangla">{category.name_bn}</h4>
                              <p className="text-sm text-muted-foreground">{category.name}</p>
                            </div>
                            <Badge variant={category.is_recurring ? 'default' : 'outline'}>
                              {category.is_recurring ? category.frequency : 'একবার'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-bangla">ছাড় ও বৃত্তি</CardTitle>
                <Button onClick={() => { resetDiscountForm(); setShowDiscountDialog(true); }} className="font-bangla">
                  <Plus className="w-4 h-4 mr-2" /> নতুন ছাড় যোগ
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">ছাড়ের নাম</TableHead>
                      <TableHead className="font-bangla">ধরন</TableHead>
                      <TableHead className="font-bangla">মান</TableHead>
                      <TableHead className="font-bangla">মানদণ্ড</TableHead>
                      <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDiscounts ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 font-bangla">লোড হচ্ছে...</TableCell>
                      </TableRow>
                    ) : discounts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-bangla">
                          কোনো ছাড় নেই
                        </TableCell>
                      </TableRow>
                    ) : (
                      discounts?.map((discount) => (
                        <TableRow key={discount.id}>
                          <TableCell className="font-bangla font-medium">
                            {discount.name_bn || discount.name}
                          </TableCell>
                          <TableCell className="font-bangla">
                            {discount.discount_type === 'percentage' ? 'শতাংশ' : 'নির্দিষ্ট'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}%` 
                              : `৳${Number(discount.discount_value).toLocaleString()}`
                            }
                          </TableCell>
                          <TableCell className="font-bangla">
                            {criteriaLabels[discount.criteria] || discount.criteria}
                          </TableCell>
                          <TableCell>
                            <Badge variant={discount.is_active ? 'default' : 'secondary'}>
                              {discount.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openEditDiscount(discount)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Structure Dialog */}
        <Dialog open={showStructureDialog} onOpenChange={setShowStructureDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-bangla">
                {editingStructure ? 'ফি কাঠামো সম্পাদনা' : 'নতুন ফি কাঠামো'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">নাম (বাংলা)</Label>
                  <Input
                    value={structureForm.name_bn}
                    onChange={(e) => setStructureForm({ ...structureForm, name_bn: e.target.value })}
                    placeholder="যেমন: মাসিক বেতন"
                    className="font-bangla"
                  />
                </div>
                <div>
                  <Label className="font-bangla">নাম (ইংরেজি)</Label>
                  <Input
                    value={structureForm.name}
                    onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                    placeholder="e.g. Monthly Tuition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">ফির ধরন</Label>
                  <Select value={structureForm.fee_type} onValueChange={(v) => setStructureForm({ ...structureForm, fee_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name.toLowerCase().replace(' ', '_')}>
                          {cat.name_bn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">শ্রেণী</Label>
                  <Select
                    value={structureForm.class || 'all'}
                    onValueChange={(v) => setStructureForm({ ...structureForm, class: v === 'all' ? '' : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="সকল শ্রেণী" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সকল শ্রেণী</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">শিক্ষাবর্ষ</Label>
                  <Select value={structureForm.academic_year} onValueChange={(v) => setStructureForm({ ...structureForm, academic_year: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {academicYears.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">পরিমাণ (টাকা)</Label>
                  <Input
                    type="number"
                    value={structureForm.amount}
                    onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={structureForm.is_active}
                  onCheckedChange={(v) => setStructureForm({ ...structureForm, is_active: v })}
                />
                <Label className="font-bangla">সক্রিয়</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStructureDialog(false)} className="font-bangla">বাতিল</Button>
              <Button onClick={() => structureMutation.mutate(structureForm)} disabled={structureMutation.isPending} className="font-bangla">
                {editingStructure ? 'আপডেট' : 'যোগ করুন'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Discount Dialog */}
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-bangla">
                {editingDiscount ? 'ছাড় সম্পাদনা' : 'নতুন ছাড় যোগ'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">নাম (বাংলা)</Label>
                  <Input
                    value={discountForm.name_bn}
                    onChange={(e) => setDiscountForm({ ...discountForm, name_bn: e.target.value })}
                    placeholder="যেমন: মেধা বৃত্তি"
                    className="font-bangla"
                  />
                </div>
                <div>
                  <Label className="font-bangla">নাম (ইংরেজি)</Label>
                  <Input
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    placeholder="e.g. Merit Scholarship"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">ছাড়ের ধরন</Label>
                  <Select value={discountForm.discount_type} onValueChange={(v) => setDiscountForm({ ...discountForm, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">শতাংশ (%)</SelectItem>
                      <SelectItem value="fixed">নির্দিষ্ট পরিমাণ (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">
                    {discountForm.discount_type === 'percentage' ? 'শতাংশ' : 'পরিমাণ (টাকা)'}
                  </Label>
                  <Input
                    type="number"
                    value={discountForm.discount_value}
                    onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bangla">মানদণ্ড</Label>
                  <Select value={discountForm.criteria} onValueChange={(v) => setDiscountForm({ ...discountForm, criteria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scholarship">বৃত্তি</SelectItem>
                      <SelectItem value="sibling">ভাই/বোন ছাড়</SelectItem>
                      <SelectItem value="staff_child">কর্মচারী সন্তান</SelectItem>
                      <SelectItem value="merit">মেধা ভিত্তিক</SelectItem>
                      <SelectItem value="need_based">প্রয়োজন ভিত্তিক</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">শিক্ষাবর্ষ</Label>
                  <Select value={discountForm.academic_year} onValueChange={(v) => setDiscountForm({ ...discountForm, academic_year: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {academicYears.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={discountForm.is_active}
                  onCheckedChange={(v) => setDiscountForm({ ...discountForm, is_active: v })}
                />
                <Label className="font-bangla">সক্রিয়</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDiscountDialog(false)} className="font-bangla">বাতিল</Button>
              <Button onClick={() => discountMutation.mutate(discountForm)} disabled={discountMutation.isPending} className="font-bangla">
                {editingDiscount ? 'আপডেট' : 'যোগ করুন'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
