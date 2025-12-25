import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, Search, User, Clock, CheckCheck, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-messages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { recipient_id: string; subject: string; content: string }) => {
      const { error } = await supabase.from('messages').insert([{
        sender_id: user?.id,
        recipient_id: data.recipient_id,
        subject: data.subject,
        content: data.content,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({ title: 'সফল!', description: 'মেসেজ পাঠানো হয়েছে' });
      setIsOpen(false);
      setRecipientId('');
      setSubject('');
      setContent('');
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !content) return;
    sendMutation.mutate({ recipient_id: recipientId, subject, content });
  };

  const getProfileName = (id: string) => {
    const profile = profiles?.find(p => p.user_id === id);
    return profile?.full_name || profile?.email || 'Unknown';
  };

  const groupedMessages = messages?.reduce((acc: any, msg: any) => {
    const otherId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
    if (!acc[otherId]) acc[otherId] = [];
    acc[otherId].push(msg);
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">মেসেজ</h1>
            <p className="text-muted-foreground font-bangla">শিক্ষক ও অভিভাবকদের সাথে যোগাযোগ করুন</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="btn-accent font-bangla"><Plus className="w-4 h-4 mr-2" /> নতুন মেসেজ</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-bangla">নতুন মেসেজ পাঠান</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <Label className="font-bangla">প্রাপক</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger><SelectValue placeholder="প্রাপক নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      {profiles?.filter(p => p.user_id !== user?.id).map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bangla">বিষয়</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="মেসেজের বিষয়" className="font-bangla" />
                </div>
                <div>
                  <Label className="font-bangla">মেসেজ</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="আপনার মেসেজ লিখুন..." rows={4} className="font-bangla" required />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="font-bangla">বাতিল</Button>
                  <Button type="submit" className="btn-accent font-bangla" disabled={sendMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" /> পাঠান
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-bangla text-lg">কথোপকথন</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো মেসেজ নেই</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {Object.entries(groupedMessages).map(([otherId, msgs]: [string, any]) => (
                    <button
                      key={otherId}
                      onClick={() => setSelectedConversation(otherId)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${selectedConversation === otherId ? 'bg-muted' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate font-bangla">{getProfileName(otherId)}</p>
                          <p className="text-sm text-muted-foreground truncate font-bangla">{msgs[0]?.subject || msgs[0]?.content?.slice(0, 30)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msgs[0]?.created_at), 'dd/MM')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {selectedConversation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium font-bangla">{getProfileName(selectedConversation)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {groupedMessages[selectedConversation]?.slice().reverse().map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl p-4 ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {msg.subject && <p className="font-medium mb-1 font-bangla">{msg.subject}</p>}
                          <p className="font-bangla">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-2 text-xs ${msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(msg.created_at), 'dd/MM/yy HH:mm')}</span>
                            {msg.sender_id === user?.id && <CheckCheck className="w-3 h-3 ml-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Input 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder="আপনার উত্তর লিখুন..." 
                      className="font-bangla"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newMessage.trim()) {
                          sendMutation.mutate({ recipient_id: selectedConversation, subject: '', content: newMessage });
                          setNewMessage('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        if (newMessage.trim()) {
                          sendMutation.mutate({ recipient_id: selectedConversation, subject: '', content: newMessage });
                          setNewMessage('');
                        }
                      }}
                      className="btn-accent"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-bangla">একটি কথোপকথন নির্বাচন করুন</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
