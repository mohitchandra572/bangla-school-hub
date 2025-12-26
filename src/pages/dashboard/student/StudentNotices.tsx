import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isAfter } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useState } from 'react';
import { Bell, Search, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function StudentNotices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch notices
  const { data: notices, isLoading } = useQuery({
    queryKey: ['student-notices'],
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

  // Fetch notifications (for marking as read)
  const { data: notifications } = useQuery({
    queryKey: ['student-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notifications'] });
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
      'general': { label: 'সাধারণ', variant: 'outline' }
    };
    const cat = categories[category || 'general'] || categories.general;
    return <Badge variant={cat.variant} className="font-bangla">{cat.label}</Badge>;
  };

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">নোটিশ ও ঘোষণা</h1>
            <p className="text-muted-foreground font-bangla">স্কুলের সকল গুরুত্বপূর্ণ নোটিশ</p>
          </div>
          {unreadNotifications.length > 0 && (
            <Badge variant="destructive" className="font-bangla">
              {unreadNotifications.length} অপঠিত নোটিফিকেশন
            </Badge>
          )}
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

        {/* Notifications Section */}
        {unreadNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <Bell className="h-5 w-5" />
                অপঠিত নোটিফিকেশন
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unreadNotifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium font-bangla">{notification.title_bn || notification.title}</p>
                        <p className="text-sm text-muted-foreground font-bangla line-clamp-2">
                          {notification.message_bn || notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(notification.created_at!), 'dd MMMM, hh:mm a', { locale: bn })}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notices List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotices && filteredNotices.length > 0 ? (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <Card key={notice.id} className="overflow-hidden">
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
                  <div className="prose prose-sm max-w-none dark:prose-invert font-bangla">
                    <p className="whitespace-pre-wrap">{notice.content_bn || notice.content}</p>
                  </div>
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
    </DashboardLayout>
  );
}
