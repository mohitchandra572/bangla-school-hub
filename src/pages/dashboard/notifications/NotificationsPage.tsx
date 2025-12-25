import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, Check, CheckCheck, Trash2, Filter, 
  AlertCircle, Info, CheckCircle, AlertTriangle 
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  fee: 'bg-yellow-100 text-yellow-700',
  exam: 'bg-blue-100 text-blue-700',
  result: 'bg-green-100 text-green-700',
  attendance: 'bg-purple-100 text-purple-700',
  message: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700',
};

const categoryLabels: Record<string, string> = {
  fee: 'ফি',
  exam: 'পরীক্ষা',
  result: 'ফলাফল',
  attendance: 'উপস্থিতি',
  message: 'মেসেজ',
  general: 'সাধারণ',
};

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  alert: AlertCircle,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          toast({
            title: payload.new.title_bn || payload.new.title,
            description: payload.new.message_bn || payload.new.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast({ title: 'সফল!', description: 'সব নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে' });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const filteredNotifications = notifications?.filter(n => 
    filter === 'all' ? true : !n.is_read
  );

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'এইমাত্র';
    if (minutes < 60) return `${minutes} মিনিট আগে`;
    if (hours < 24) return `${hours} ঘণ্টা আগে`;
    if (days < 7) return `${days} দিন আগে`;
    return date.toLocaleDateString('bn-BD');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">নোটিফিকেশন</h1>
            <p className="text-muted-foreground font-bangla">
              {unreadCount > 0 ? `${unreadCount} টি অপঠিত নোটিফিকেশন` : 'সব পঠিত'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
              className="font-bangla"
            >
              সকল
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('unread')}
              className="font-bangla"
            >
              অপঠিত ({unreadCount})
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="font-bangla"
              >
                <CheckCheck className="w-4 h-4 mr-1" /> সব পঠিত করুন
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border animate-pulse h-24" />
            ))}
          </div>
        ) : filteredNotifications?.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-bangla">
              {filter === 'unread' ? 'কোনো অপঠিত নোটিফিকেশন নেই' : 'কোনো নোটিফিকেশন নেই'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications?.map((notification, index) => {
              const Icon = typeIcons[notification.type || 'info'] || Info;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-xl p-4 border shadow-soft transition-all ${
                    !notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'warning' ? 'bg-yellow-100' :
                      notification.type === 'success' ? 'bg-green-100' :
                      notification.type === 'alert' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        notification.type === 'warning' ? 'text-yellow-600' :
                        notification.type === 'success' ? 'text-green-600' :
                        notification.type === 'alert' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold font-bangla">
                          {notification.title_bn || notification.title}
                        </h4>
                        {notification.category && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bangla ${
                            categoryColors[notification.category] || categoryColors.general
                          }`}>
                            {categoryLabels[notification.category] || notification.category}
                          </span>
                        )}
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-bangla">
                        {notification.message_bn || notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 font-bangla">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          title="পঠিত হিসেবে চিহ্নিত করুন"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        className="text-destructive hover:text-destructive"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
