import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye } from 'lucide-react';

const actionLabels: Record<string, string> = {
  INSERT: 'তৈরি', UPDATE: 'সম্পাদনা', DELETE: 'মুছে ফেলা', LOGIN: 'লগইন', LOGOUT: 'লগআউট',
};

const entityLabels: Record<string, string> = {
  students: 'শিক্ষার্থী', teachers: 'শিক্ষক', fees: 'ফি', results: 'ফলাফল', notices: 'নোটিশ', exams: 'পরীক্ষা',
};

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name, full_name_bn)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">অডিট লগ</h1>
            <p className="text-muted-foreground font-bangla">সিস্টেমের সকল কার্যক্রমের রেকর্ড</p>
          </div>
          <Button variant="outline" className="font-bangla"><Download className="w-4 h-4 mr-2" /> এক্সপোর্ট</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="খুঁজুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 font-bangla" />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-40 font-bangla"><SelectValue placeholder="অ্যাকশন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল</SelectItem>
              <SelectItem value="INSERT">তৈরি</SelectItem>
              <SelectItem value="UPDATE">সম্পাদনা</SelectItem>
              <SelectItem value="DELETE">মুছে ফেলা</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bangla">সময়</TableHead>
                <TableHead className="font-bangla">ব্যবহারকারী</TableHead>
                <TableHead className="font-bangla">অ্যাকশন</TableHead>
                <TableHead className="font-bangla">এনটিটি</TableHead>
                <TableHead className="font-bangla">বিবরণ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 font-bangla">লোড হচ্ছে...</TableCell></TableRow>
              ) : filteredLogs?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-bangla">কোনো লগ পাওয়া যায়নি</TableCell></TableRow>
              ) : (
                filteredLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.created_at).toLocaleString('bn-BD')}</TableCell>
                    <TableCell className="font-bangla">{(log.profiles as any)?.full_name_bn || 'সিস্টেম'}</TableCell>
                    <TableCell>
                      <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'INSERT' ? 'default' : 'secondary'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bangla">{entityLabels[log.entity_type] || log.entity_type}</TableCell>
                    <TableCell><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
