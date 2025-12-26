import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  MessageSquare, Send, Inbox, Mail, Search, 
  User, Clock, CheckCircle2, Plus
} from 'lucide-react';

export default function TeacherMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [messageForm, setMessageForm] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });

  // Fetch teacher info
  const { data: teacher } = useQuery({
    queryKey: ['teacher-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch messages (sent and received)
  const { data: messages, isLoading } = useQuery({
    queryKey: ['teacher-messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch students with their parents for messaging
  const { data: students } = useQuery({
    queryKey: ['teacher-students-parents', teacher?.assigned_classes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, full_name_bn, class, section, parent_id')
        .in('class', teacher?.assigned_classes || [])
        .not('parent_id', 'is', null)
        .eq('status', 'active')
        .order('class')
        .order('roll_number');
      if (error) throw error;
      return data;
    },
    enabled: !!(teacher?.assigned_classes && teacher.assigned_classes.length > 0)
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageForm.recipient_id || !messageForm.content) {
        throw new Error('প্রাপক এবং বার্তা প্রয়োজন');
      }
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: messageForm.recipient_id,
          subject: messageForm.subject || null,
          content: messageForm.content
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('বার্তা সফলভাবে পাঠানো হয়েছে');
      setMessageForm({ recipient_id: '', subject: '', content: '' });
      setIsComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ['teacher-messages'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'বার্তা পাঠাতে ব্যর্থ হয়েছে');
    }
  });

  const inboxMessages = messages?.filter(m => m.recipient_id === user?.id) || [];
  const sentMessages = messages?.filter(m => m.sender_id === user?.id) || [];
  const unreadCount = inboxMessages.filter(m => !m.is_read).length;

  // Filter students by class
  const filteredStudents = students?.filter(s => 
    selectedClass === 'all' || s.class === selectedClass
  ) || [];

  // Get unique classes from students
  const uniqueClasses = [...new Set(students?.map(s => s.class) || [])];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">বার্তা</h1>
            <p className="text-muted-foreground font-bangla">অভিভাবকদের সাথে যোগাযোগ করুন</p>
          </div>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="font-bangla">
                <Plus className="h-4 w-4 mr-2" />
                নতুন বার্তা
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-bangla">নতুন বার্তা লিখুন</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">শ্রেণি</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="font-bangla">
                        <SelectValue placeholder="শ্রেণি নির্বাচন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-bangla">সকল শ্রেণি</SelectItem>
                        {uniqueClasses.map((cls) => (
                          <SelectItem key={cls} value={cls} className="font-bangla">
                            {cls} শ্রেণি
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bangla">শিক্ষার্থী (অভিভাবক)</Label>
                    <Select 
                      value={messageForm.recipient_id} 
                      onValueChange={(v) => setMessageForm({ ...messageForm, recipient_id: v })}
                    >
                      <SelectTrigger className="font-bangla">
                        <SelectValue placeholder="নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudents.map((student) => (
                          <SelectItem key={student.id} value={student.parent_id!} className="font-bangla">
                            {student.full_name_bn || student.full_name} ({student.class})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="font-bangla">বিষয়</Label>
                  <Input
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    placeholder="বার্তার বিষয়"
                    className="font-bangla"
                  />
                </div>
                <div>
                  <Label className="font-bangla">বার্তা</Label>
                  <Textarea
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                    placeholder="আপনার বার্তা লিখুন..."
                    rows={5}
                    className="font-bangla"
                  />
                </div>
                <Button 
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={sendMessageMutation.isPending || !messageForm.recipient_id || !messageForm.content}
                  className="w-full font-bangla"
                >
                  {sendMessageMutation.isPending ? (
                    'পাঠানো হচ্ছে...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      বার্তা পাঠান
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Inbox className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inboxMessages.length}</p>
                  <p className="text-sm text-muted-foreground font-bangla">প্রাপ্ত বার্তা</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sentMessages.length}</p>
                  <p className="text-sm text-muted-foreground font-bangla">প্রেরিত বার্তা</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${unreadCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                  <Mail className={`h-6 w-6 ${unreadCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground font-bangla">অপঠিত</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="বার্তা খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-bangla"
          />
        </div>

        {/* Messages Tabs */}
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="font-bangla">
            <TabsTrigger value="inbox">
              ইনবক্স {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent">প্রেরিত</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : inboxMessages.length > 0 ? (
              <div className="space-y-3">
                {inboxMessages
                  .filter(m => 
                    !searchTerm || 
                    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.content.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((message) => (
                    <Card key={message.id} className={!message.is_read ? 'border-primary/50 bg-primary/5' : ''}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              {message.subject && (
                                <p className="font-medium">{message.subject}</p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2 font-bangla">
                                {message.content}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'dd MMM, hh:mm a', { locale: bn })}
                            </p>
                            {!message.is_read && (
                              <Badge variant="destructive" className="mt-1 font-bangla text-xs">নতুন</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো বার্তা নেই</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {sentMessages.length > 0 ? (
              <div className="space-y-3">
                {sentMessages
                  .filter(m => 
                    !searchTerm || 
                    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.content.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((message) => (
                    <Card key={message.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                              <Send className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              {message.subject && (
                                <p className="font-medium">{message.subject}</p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2 font-bangla">
                                {message.content}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'dd MMM, hh:mm a', { locale: bn })}
                            </p>
                            {message.is_read && (
                              <div className="flex items-center gap-1 text-green-600 mt-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-xs font-bangla">পঠিত</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো প্রেরিত বার্তা নেই</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
