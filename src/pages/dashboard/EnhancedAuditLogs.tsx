import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Download, Eye, Filter, Calendar, 
  Activity, Users, Database, Shield, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

const actionLabels: Record<string, string> = {
  INSERT: 'তৈরি',
  UPDATE: 'সম্পাদনা',
  DELETE: 'মুছে ফেলা',
  LOGIN: 'লগইন',
  LOGOUT: 'লগআউট',
};

const actionColors: Record<string, string> = {
  INSERT: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  LOGIN: 'bg-purple-500',
  LOGOUT: 'bg-gray-500',
};

const entityLabels: Record<string, string> = {
  students: 'শিক্ষার্থী',
  teachers: 'শিক্ষক',
  fees: 'ফি',
  results: 'ফলাফল',
  notices: 'নোটিশ',
  exams: 'পরীক্ষা',
  schools: 'স্কুল',
  users: 'ব্যবহারকারী',
  attendance: 'উপস্থিতি',
};

export default function EnhancedAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['enhanced-audit-logs', page, filterAction, filterEntity, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*, profiles:user_id(full_name, full_name_bn, email)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Date filter
      const now = new Date();
      if (dateRange === '24h') {
        query = query.gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
      } else if (dateRange === '7d') {
        query = query.gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (dateRange === '30d') {
        query = query.gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }

      // Action filter
      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      // Entity filter
      if (filterEntity !== 'all') {
        query = query.eq('entity_type', filterEntity);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    },
  });

  // Stats query
  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { count: todayCount } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', dayAgo.toISOString());

      const { count: totalCount } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact' });

      const { data: byAction } = await supabase
        .from('audit_logs')
        .select('action')
        .gte('created_at', dayAgo.toISOString());

      const actionCounts = (byAction || []).reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        today: todayCount || 0,
        total: totalCount || 0,
        actions: actionCounts,
      };
    },
  });

  const filteredLogs = data?.logs?.filter(log =>
    log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const exportLogs = () => {
    const csvContent = [
      ['সময়', 'ব্যবহারকারী', 'অ্যাকশন', 'এনটিটি', 'আইডি'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        (log.profiles as any)?.full_name || 'সিস্টেম',
        log.action,
        log.entity_type,
        log.entity_id || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla flex items-center gap-2">
              <Activity className="w-7 h-7" />
              অডিট লগ
            </h1>
            <p className="text-muted-foreground font-bangla">সিস্টেমের সকল কার্যক্রমের বিস্তারিত রেকর্ড</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} className="font-bangla">
              <RefreshCw className="w-4 h-4 mr-2" /> রিফ্রেশ
            </Button>
            <Button variant="outline" onClick={exportLogs} className="font-bangla">
              <Download className="w-4 h-4 mr-2" /> এক্সপোর্ট CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.today || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">আজকের কার্যক্রম</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Database className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.actions?.INSERT || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">নতুন তৈরি</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.actions?.UPDATE || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">সম্পাদনা</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.actions?.DELETE || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">মুছে ফেলা</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="ব্যবহারকারী বা এনটিটি খুঁজুন..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 font-bangla" 
                />
              </div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">গত ২৪ ঘন্টা</SelectItem>
                  <SelectItem value="7d">গত ৭ দিন</SelectItem>
                  <SelectItem value="30d">গত ৩০ দিন</SelectItem>
                  <SelectItem value="all">সব সময়</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-40 font-bangla">
                  <SelectValue placeholder="অ্যাকশন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল অ্যাকশন</SelectItem>
                  <SelectItem value="INSERT">তৈরি</SelectItem>
                  <SelectItem value="UPDATE">সম্পাদনা</SelectItem>
                  <SelectItem value="DELETE">মুছে ফেলা</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-40 font-bangla">
                  <SelectValue placeholder="এনটিটি" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল এনটিটি</SelectItem>
                  <SelectItem value="students">শিক্ষার্থী</SelectItem>
                  <SelectItem value="teachers">শিক্ষক</SelectItem>
                  <SelectItem value="schools">স্কুল</SelectItem>
                  <SelectItem value="fees">ফি</SelectItem>
                  <SelectItem value="exams">পরীক্ষা</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bangla w-48">সময়</TableHead>
                  <TableHead className="font-bangla">ব্যবহারকারী</TableHead>
                  <TableHead className="font-bangla w-32">অ্যাকশন</TableHead>
                  <TableHead className="font-bangla w-32">এনটিটি</TableHead>
                  <TableHead className="font-bangla">আইপি</TableHead>
                  <TableHead className="font-bangla w-20">বিবরণ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 font-bangla">
                      লোড হচ্ছে...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-bangla">
                      কোনো লগ পাওয়া যায়নি
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm">
                        <div>
                          <p>{format(new Date(log.created_at), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium font-bangla">{(log.profiles as any)?.full_name_bn || (log.profiles as any)?.full_name || 'সিস্টেম'}</p>
                          <p className="text-xs text-muted-foreground">{(log.profiles as any)?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${actionColors[log.action]} text-white`}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bangla">{entityLabels[log.entity_type] || log.entity_type}</TableCell>
                      <TableCell className="text-xs font-mono">{log.ip_address || '-'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-bangla">
            মোট {data?.total || 0} টি লগ
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bangla">
              পৃষ্ঠা {page} / {totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-bangla flex items-center gap-2">
                <Activity className="w-5 h-5" />
                লগ বিবরণ
              </DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla">সময়</p>
                    <p className="font-medium">{format(new Date(selectedLog.created_at), 'PPpp')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla">অ্যাকশন</p>
                    <Badge className={`${actionColors[selectedLog.action]} text-white`}>
                      {actionLabels[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla">এনটিটি</p>
                    <p className="font-medium font-bangla">{entityLabels[selectedLog.entity_type] || selectedLog.entity_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla">এনটিটি আইডি</p>
                    <p className="font-mono text-sm">{selectedLog.entity_id || '-'}</p>
                  </div>
                </div>
                
                {selectedLog.old_values && (
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla mb-2">পূর্বের মান</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.new_values && (
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla mb-2">নতুন মান</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla">আইপি</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-bangla">ইউজার এজেন্ট</p>
                    <p className="text-xs truncate">{selectedLog.user_agent || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
