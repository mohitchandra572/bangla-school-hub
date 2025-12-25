import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, Key, Copy, Search, UserCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Parent {
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  children: {
    id: string;
    full_name: string;
    class: string;
    roll_number: string;
  }[];
  has_account: boolean;
}

interface GeneratedCredentials {
  email: string;
  password: string;
  full_name: string;
}

export default function ParentsManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<GeneratedCredentials | null>(null);
  const [creatingAccount, setCreatingAccount] = useState<string | null>(null);

  // Get user's school
  const { data: userSchool } = useQuery({
    queryKey: ['user-school', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('school_users')
        .select('school_id')
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch parents with their children
  const { data: parents, isLoading } = useQuery({
    queryKey: ['parents', userSchool?.school_id],
    queryFn: async () => {
      // Get all students with parent_id
      const { data: students, error } = await supabase
        .from('students')
        .select('id, full_name, class, roll_number, parent_id')
        .eq('school_id', userSchool?.school_id)
        .not('parent_id', 'is', null);

      if (error) throw error;

      // Group by parent_id
      const parentMap = new Map<string, Parent>();
      
      for (const student of students || []) {
        if (!student.parent_id) continue;
        
        // Get parent profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, phone')
          .eq('user_id', student.parent_id)
          .single();

        if (profile) {
          if (parentMap.has(profile.user_id)) {
            parentMap.get(profile.user_id)!.children.push({
              id: student.id,
              full_name: student.full_name,
              class: student.class,
              roll_number: student.roll_number,
            });
          } else {
            parentMap.set(profile.user_id, {
              user_id: profile.user_id,
              email: profile.email || '',
              full_name: profile.full_name,
              phone: profile.phone,
              children: [{
                id: student.id,
                full_name: student.full_name,
                class: student.class,
                roll_number: student.roll_number,
              }],
              has_account: true,
            });
          }
        }
      }

      return Array.from(parentMap.values());
    },
    enabled: !!userSchool?.school_id,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি করা হয়েছে');
  };

  const filteredParents = parents?.filter(parent =>
    parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.children.some(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: parents?.length || 0,
    withMultipleChildren: parents?.filter(p => p.children.length > 1).length || 0,
    totalChildren: parents?.reduce((acc, p) => acc + p.children.length, 0) || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">অভিভাবক ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground font-bangla">অভিভাবক তথ্য ও সন্তান সংযুক্তি</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground font-bangla">মোট অভিভাবক</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <GraduationCap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalChildren}</p>
                  <p className="text-sm text-muted-foreground font-bangla">সংযুক্ত শিক্ষার্থী</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <UserCheck className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withMultipleChildren}</p>
                  <p className="text-sm text-muted-foreground font-bangla">একাধিক সন্তান</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm font-bangla text-blue-800">
              💡 অভিভাবক অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে তৈরি হয় যখন আপনি শিক্ষার্থী যুক্ত করার সময় অভিভাবকের তথ্য দেন।
              শিক্ষার্থী ম্যানেজমেন্ট থেকে নতুন অভিভাবক যুক্ত করুন।
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="অভিভাবক খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 font-bangla"
            />
          </div>
        </div>

        {/* Parents Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla">অভিভাবক</TableHead>
                  <TableHead className="font-bangla">যোগাযোগ</TableHead>
                  <TableHead className="font-bangla">সন্তান</TableHead>
                  <TableHead className="font-bangla">অ্যাকাউন্ট</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <span className="font-bangla">লোড হচ্ছে...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredParents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <span className="font-bangla">কোনো অভিভাবক পাওয়া যায়নি</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParents?.map((parent) => (
                    <TableRow key={parent.user_id}>
                      <TableCell>
                        <p className="font-medium">{parent.full_name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{parent.email}</p>
                          {parent.phone && <p className="text-muted-foreground">{parent.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {parent.children.map((child) => (
                            <Badge key={child.id} variant="outline" className="mr-1 font-bangla">
                              {child.full_name} ({child.class} - {child.roll_number})
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500 font-bangla">
                          <Key className="w-3 h-3 mr-1" />
                          সক্রিয়
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Credentials Dialog */}
        <Dialog open={isCredentialDialogOpen} onOpenChange={setIsCredentialDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-bangla">অভিভাবক লগইন তথ্য</DialogTitle>
            </DialogHeader>
            {credentials && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">নাম</p>
                      <p className="font-medium">{credentials.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">ইমেইল</p>
                      <p className="font-medium">{credentials.email}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-bangla">পাসওয়ার্ড</p>
                      <p className="font-mono text-lg">{credentials.password}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(credentials.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsCredentialDialogOpen(false)}>
                <span className="font-bangla">বন্ধ করুন</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
