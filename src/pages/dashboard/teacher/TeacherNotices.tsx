import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isAfter } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useState } from 'react';
import { Search, Calendar, FileText, Bell, AlertTriangle } from 'lucide-react';

export default function TeacherNotices() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch notices
  const { data: notices, isLoading } = useQuery({
    queryKey: ['teacher-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Filter notices
  const filteredNotices = notices?.filter(notice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      notice.title.toLowerCase().includes(searchLower) ||
      notice.title_bn?.toLowerCase().includes(searchLower) ||
      notice.content.toLowerCase().includes(searchLower) ||
      notice.content_bn?.toLowerCase().includes(searchLower)
    );
  });

  const getCategoryBadge = (category: string | null) => {
    const categories: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'exam': { label: 'পরীক্ষা', variant: 'default' },
      'holiday': { label: 'ছুটি', variant: 'secondary' },
      'event': { label: 'অনুষ্ঠান', variant: 'outline' },
      'urgent': { label: 'জরুরি', variant: 'destructive' },
      'staff': { label: 'শিক্ষক', variant: 'default' },
      'general': { label: 'সাধারণ', variant: 'outline' }
    };
    const cat = categories[category || 'general'] || categories.general;
    return <Badge variant={cat.variant} className="font-bangla">{cat.label}</Badge>;
  };

  const urgentNotices = notices?.filter(n => n.category === 'urgent') || [];
  const staffNotices = notices?.filter(n => n.category === 'staff') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">নোটিশ বোর্ড</h1>
          <p className="text-muted-foreground font-bangla">স্কুলের সকল গুরুত্বপূর্ণ নোটিশ ও ঘোষণা</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notices?.length || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">মোট নোটিশ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{urgentNotices.length}</p>
                  <p className="text-sm text-muted-foreground font-bangla">জরুরি নোটিশ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{staffNotices.length}</p>
                  <p className="text-sm text-muted-foreground font-bangla">শিক্ষক নোটিশ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নোটিশ খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-bangla"
          />
        </div>

        {/* Urgent Notices */}
        {urgentNotices.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold font-bangla mb-4 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              জরুরি নোটিশ
            </h2>
            <div className="space-y-4">
              {urgentNotices.map((notice) => (
                <Card key={notice.id} className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <CardTitle className="font-bangla text-lg text-red-700 dark:text-red-400">
                        {notice.title_bn || notice.title}
                      </CardTitle>
                      {getCategoryBadge(notice.category)}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(notice.published_at!), 'dd MMMM yyyy', { locale: bn })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap font-bangla">{notice.content_bn || notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Notices */}
        <div>
          <h2 className="text-lg font-semibold font-bangla mb-4">সকল নোটিশ</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotices && filteredNotices.length > 0 ? (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <Card key={notice.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="font-bangla text-lg">
                          {notice.title_bn || notice.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(parseISO(notice.published_at!), 'dd MMMM yyyy', { locale: bn })}
                            </span>
                          </div>
                          {notice.expires_at && isAfter(parseISO(notice.expires_at), new Date()) && (
                            <span className="text-yellow-600 font-bangla">
                              মেয়াদ: {format(parseISO(notice.expires_at), 'dd MMM yyyy', { locale: bn })}
                            </span>
                          )}
                        </div>
                      </div>
                      {getCategoryBadge(notice.category)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap font-bangla text-muted-foreground">
                      {notice.content_bn || notice.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-bangla">
                  {searchTerm ? 'কোনো নোটিশ পাওয়া যায়নি' : 'কোনো নোটিশ নেই'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
