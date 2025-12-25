import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, FileText, Calendar, Filter } from 'lucide-react';

const categories = [
  { value: 'general', label: 'সাধারণ' },
  { value: 'academic', label: 'একাডেমিক' },
  { value: 'exam', label: 'পরীক্ষা' },
  { value: 'event', label: 'অনুষ্ঠান' },
  { value: 'holiday', label: 'ছুটি' },
  { value: 'fee', label: 'ফি' },
  { value: 'urgent', label: 'জরুরি' },
];

export default function NoticesManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    title_bn: '',
    content: '',
    content_bn: '',
    category: 'general',
    is_published: true,
    expires_at: '',
  });

  // Fetch notices
  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices-management', searchTerm, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,title_bn.ilike.%${searchTerm}%`);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('notices').insert([{
        ...data,
        expires_at: data.expires_at || null,
        created_by: user?.id,
        published_at: data.is_published ? new Date().toISOString() : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-management'] });
      toast.success('নোটিশ সফলভাবে প্রকাশ হয়েছে');
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'নোটিশ প্রকাশে সমস্যা হয়েছে');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('notices').update({
        ...data,
        expires_at: data.expires_at || null,
        published_at: data.is_published ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-management'] });
      toast.success('নোটিশ আপডেট হয়েছে');
      resetForm();
      setIsOpen(false);
      setEditingNotice(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-management'] });
      toast.success('নোটিশ মুছে ফেলা হয়েছে');
    },
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { error } = await supabase.from('notices').update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-management'] });
      toast.success('নোটিশের অবস্থা পরিবর্তন হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      title_bn: '',
      content: '',
      content_bn: '',
      category: 'general',
      is_published: true,
      expires_at: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      title_bn: notice.title_bn || '',
      content: notice.content || '',
      content_bn: notice.content_bn || '',
      category: notice.category || 'general',
      is_published: notice.is_published || false,
      expires_at: notice.expires_at ? format(new Date(notice.expires_at), 'yyyy-MM-dd') : '',
    });
    setIsOpen(true);
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-500/10 text-red-600';
      case 'exam': return 'bg-purple-500/10 text-purple-600';
      case 'academic': return 'bg-blue-500/10 text-blue-600';
      case 'event': return 'bg-green-500/10 text-green-600';
      case 'holiday': return 'bg-amber-500/10 text-amber-600';
      case 'fee': return 'bg-cyan-500/10 text-cyan-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">নোটিশ ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              নোটিশ তৈরি, সম্পাদনা এবং প্রকাশ করুন
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) { setEditingNotice(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-bangla">নতুন নোটিশ</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ তৈরি করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">শিরোনাম (ইংরেজি)</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">শিরোনাম (বাংলা)</Label>
                    <Input
                      value={formData.title_bn}
                      onChange={(e) => setFormData({...formData, title_bn: e.target.value})}
                      className="font-bangla"
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-bangla">বিষয়বস্তু (ইংরেজি)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label className="font-bangla">বিষয়বস্তু (বাংলা)</Label>
                  <Textarea
                    value={formData.content_bn}
                    onChange={(e) => setFormData({...formData, content_bn: e.target.value})}
                    rows={4}
                    className="font-bangla"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">ক্যাটেগরি</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value} className="font-bangla">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">মেয়াদ শেষ তারিখ (ঐচ্ছিক)</Label>
                    <Input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({...formData, is_published: checked})}
                  />
                  <Label className="font-bangla">এখনই প্রকাশ করুন</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    <span className="font-bangla">বাতিল</span>
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    <span className="font-bangla">{editingNotice ? 'আপডেট করুন' : 'প্রকাশ করুন'}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="নোটিশ খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-bangla"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="ক্যাটেগরি" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bangla">সব ক্যাটেগরি</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="font-bangla">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">নোটিশ তালিকা</CardTitle>
            <CardDescription className="font-bangla">
              মোট {notices?.length || 0}টি নোটিশ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notices?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো নোটিশ পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">শিরোনাম</TableHead>
                      <TableHead className="font-bangla">ক্যাটেগরি</TableHead>
                      <TableHead className="font-bangla">প্রকাশের তারিখ</TableHead>
                      <TableHead className="font-bangla">অবস্থা</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices?.map((notice: any) => (
                      <TableRow key={notice.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium font-bangla">{notice.title_bn || notice.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {notice.content_bn || notice.content}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(notice.category)}>
                            {getCategoryLabel(notice.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {notice.published_at 
                                ? format(new Date(notice.published_at), 'dd MMM yyyy', { locale: bn })
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notice.is_published}
                              onCheckedChange={(checked) => togglePublishMutation.mutate({ id: notice.id, isPublished: checked })}
                            />
                            <span className="text-sm font-bangla">
                              {notice.is_published ? 'প্রকাশিত' : 'খসড়া'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                if (confirm('আপনি কি এই নোটিশ মুছে ফেলতে চান?')) {
                                  deleteMutation.mutate(notice.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}