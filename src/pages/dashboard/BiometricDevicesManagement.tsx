import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  Plus, Edit, Trash2, Wifi, WifiOff, RefreshCw, Settings, 
  Activity, Clock, AlertCircle, CheckCircle2, Server, Fingerprint
} from 'lucide-react';

const deviceTypes = [
  { value: 'fingerprint', label: 'ফিঙ্গারপ্রিন্ট', icon: Fingerprint },
  { value: 'face', label: 'ফেস রিকগনিশন', icon: Activity },
  { value: 'card', label: 'কার্ড রিডার', icon: Server },
  { value: 'multi', label: 'মাল্টি-মোড', icon: Settings },
];

const classes = ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const sections = ['ক', 'খ', 'গ', 'ঘ'];

const statusColors: Record<string, string> = {
  online: 'bg-green-500/10 text-green-600',
  offline: 'bg-gray-500/10 text-gray-600',
  error: 'bg-red-500/10 text-red-600',
  syncing: 'bg-blue-500/10 text-blue-600',
};

const statusLabels: Record<string, string> = {
  online: 'অনলাইন',
  offline: 'অফলাইন',
  error: 'ত্রুটি',
  syncing: 'সিঙ্ক হচ্ছে',
};

interface DeviceFormData {
  device_id: string;
  device_name: string;
  device_name_bn: string;
  location: string;
  location_bn: string;
  device_type: string;
  assigned_classes: string[];
  assigned_sections: string[];
  ip_address: string;
  port: number;
  auth_key: string;
  sync_interval_minutes: number;
  is_active: boolean;
}

const initialFormData: DeviceFormData = {
  device_id: '',
  device_name: '',
  device_name_bn: '',
  location: '',
  location_bn: '',
  device_type: 'fingerprint',
  assigned_classes: [],
  assigned_sections: [],
  ip_address: '',
  port: 4370,
  auth_key: '',
  sync_interval_minutes: 15,
  is_active: true,
};

export default function BiometricDevicesManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [formData, setFormData] = useState<DeviceFormData>(initialFormData);
  const [selectedTab, setSelectedTab] = useState('all');

  // Fetch devices
  const { data: devices, isLoading } = useQuery({
    queryKey: ['biometric-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biometric_devices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sync logs
  const { data: syncLogs } = useQuery({
    queryKey: ['device-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_sync_logs')
        .select('*, biometric_devices(device_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: DeviceFormData) => {
      const { error } = await supabase.from('biometric_devices').insert([{
        ...data,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('ডিভাইস যোগ হয়েছে');
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'ডিভাইস যোগ করতে সমস্যা হয়েছে');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DeviceFormData }) => {
      const { error } = await supabase.from('biometric_devices').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('ডিভাইস আপডেট হয়েছে');
      resetForm();
      setIsOpen(false);
      setEditingDevice(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('biometric_devices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      toast.success('ডিভাইস মুছে ফেলা হয়েছে');
    },
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      // Create sync log entry
      const { error: logError } = await supabase.from('device_sync_logs').insert([{
        device_id: deviceId,
        sync_type: 'manual',
        sync_status: 'started',
        initiated_by: user?.id,
      }]);
      if (logError) throw logError;

      // Update device status
      await supabase.from('biometric_devices').update({
        status: 'syncing',
        last_sync_at: new Date().toISOString(),
      }).eq('id', deviceId);

      // Simulate sync completion (in real implementation, this would be handled by an edge function)
      setTimeout(async () => {
        await supabase.from('biometric_devices').update({
          status: 'online',
        }).eq('id', deviceId);
        queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      }, 2000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] });
      queryClient.invalidateQueries({ queryKey: ['device-sync-logs'] });
      toast.success('সিঙ্ক শুরু হয়েছে');
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    setFormData({
      device_id: device.device_id || '',
      device_name: device.device_name || '',
      device_name_bn: device.device_name_bn || '',
      location: device.location || '',
      location_bn: device.location_bn || '',
      device_type: device.device_type || 'fingerprint',
      assigned_classes: device.assigned_classes || [],
      assigned_sections: device.assigned_sections || [],
      ip_address: device.ip_address || '',
      port: device.port || 4370,
      auth_key: device.auth_key || '',
      sync_interval_minutes: device.sync_interval_minutes || 15,
      is_active: device.is_active ?? true,
    });
    setIsOpen(true);
  };

  const filteredDevices = devices?.filter(d => {
    if (selectedTab === 'all') return true;
    return d.status === selectedTab;
  }) || [];

  const stats = {
    total: devices?.length || 0,
    online: devices?.filter(d => d.status === 'online').length || 0,
    offline: devices?.filter(d => d.status === 'offline').length || 0,
    error: devices?.filter(d => d.status === 'error').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-bangla">বায়োমেট্রিক ডিভাইস</h1>
            <p className="text-muted-foreground font-bangla mt-1">
              স্কুলের বায়োমেট্রিক ডিভাইস কনফিগার ও পরিচালনা করুন
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) { setEditingDevice(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                <span className="font-bangla">নতুন ডিভাইস</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-bangla">
                  {editingDevice ? 'ডিভাইস সম্পাদনা' : 'নতুন ডিভাইস যোগ করুন'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">ডিভাইস আইডি *</Label>
                    <Input
                      value={formData.device_id}
                      onChange={(e) => setFormData({...formData, device_id: e.target.value})}
                      placeholder="DEV-001"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">ডিভাইস টাইপ</Label>
                    <Select value={formData.device_type} onValueChange={(v) => setFormData({...formData, device_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map(type => (
                          <SelectItem key={type.value} value={type.value} className="font-bangla">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">ডিভাইস নাম (ইংরেজি) *</Label>
                    <Input
                      value={formData.device_name}
                      onChange={(e) => setFormData({...formData, device_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">ডিভাইস নাম (বাংলা)</Label>
                    <Input
                      value={formData.device_name_bn}
                      onChange={(e) => setFormData({...formData, device_name_bn: e.target.value})}
                      className="font-bangla"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">অবস্থান (ইংরেজি)</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Main Gate"
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">অবস্থান (বাংলা)</Label>
                    <Input
                      value={formData.location_bn}
                      onChange={(e) => setFormData({...formData, location_bn: e.target.value})}
                      placeholder="প্রধান গেট"
                      className="font-bangla"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">আইপি অ্যাড্রেস</Label>
                    <Input
                      value={formData.ip_address}
                      onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">পোর্ট</Label>
                    <Input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: parseInt(e.target.value) || 4370})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bangla">অথেন্টিকেশন কী</Label>
                    <Input
                      type="password"
                      value={formData.auth_key}
                      onChange={(e) => setFormData({...formData, auth_key: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label className="font-bangla">সিঙ্ক ইন্টারভাল (মিনিট)</Label>
                    <Input
                      type="number"
                      value={formData.sync_interval_minutes}
                      onChange={(e) => setFormData({...formData, sync_interval_minutes: parseInt(e.target.value) || 15})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-bangla">অ্যাসাইনড ক্লাস</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {classes.map(c => (
                      <Button
                        key={c}
                        type="button"
                        variant={formData.assigned_classes.includes(c) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const updated = formData.assigned_classes.includes(c)
                            ? formData.assigned_classes.filter(x => x !== c)
                            : [...formData.assigned_classes, c];
                          setFormData({...formData, assigned_classes: updated});
                        }}
                        className="font-bangla"
                      >
                        {c}
                      </Button>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    <span className="font-bangla">বাতিল</span>
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    <span className="font-bangla">{editingDevice ? 'আপডেট' : 'যোগ করুন'}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Server className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট ডিভাইস</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">অনলাইন</p>
                  <p className="text-2xl font-bold">{stats.online}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">অফলাইন</p>
                  <p className="text-2xl font-bold">{stats.offline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">ত্রুটি</p>
                  <p className="text-2xl font-bold">{stats.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all" className="font-bangla">সব ({stats.total})</TabsTrigger>
            <TabsTrigger value="online" className="font-bangla">অনলাইন ({stats.online})</TabsTrigger>
            <TabsTrigger value="offline" className="font-bangla">অফলাইন ({stats.offline})</TabsTrigger>
            <TabsTrigger value="error" className="font-bangla">ত্রুটি ({stats.error})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bangla">ডিভাইস তালিকা</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredDevices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-bangla">
                    কোনো ডিভাইস পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bangla">ডিভাইস</TableHead>
                          <TableHead className="font-bangla">অবস্থান</TableHead>
                          <TableHead className="font-bangla">টাইপ</TableHead>
                          <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                          <TableHead className="font-bangla">শেষ সিঙ্ক</TableHead>
                          <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDevices.map((device: any) => (
                          <TableRow key={device.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium font-bangla">{device.device_name_bn || device.device_name}</p>
                                <p className="text-sm text-muted-foreground">{device.device_id}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-bangla">
                              {device.location_bn || device.location || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bangla">
                                {deviceTypes.find(t => t.value === device.device_type)?.label || device.device_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[device.status]}>
                                {device.status === 'online' ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                                {statusLabels[device.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {device.last_sync_at ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(device.last_sync_at), { addSuffix: true, locale: bn })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground font-bangla">কখনো নয়</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => syncMutation.mutate(device.id)}
                                  disabled={syncMutation.isPending || device.status === 'syncing'}
                                  title="সিঙ্ক"
                                >
                                  <RefreshCw className={`w-4 h-4 ${device.status === 'syncing' ? 'animate-spin' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(device)} title="সম্পাদনা">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    if (confirm('এই ডিভাইস মুছে ফেলতে চান?')) {
                                      deleteMutation.mutate(device.id);
                                    }
                                  }}
                                  title="মুছুন"
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
          </TabsContent>
        </Tabs>

        {/* Sync Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">সিঙ্ক লগ</CardTitle>
            <CardDescription className="font-bangla">সাম্প্রতিক ডেটা সিঙ্ক্রোনাইজেশন লগ</CardDescription>
          </CardHeader>
          <CardContent>
            {syncLogs && syncLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">ডিভাইস</TableHead>
                      <TableHead className="font-bangla">টাইপ</TableHead>
                      <TableHead className="font-bangla">স্ট্যাটাস</TableHead>
                      <TableHead className="font-bangla">রেকর্ড</TableHead>
                      <TableHead className="font-bangla">সময়</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.slice(0, 10).map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-bangla">
                          {log.biometric_devices?.device_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.sync_type === 'manual' ? 'ম্যানুয়াল' : log.sync_type === 'auto' ? 'অটো' : 'রিকভারি'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            log.sync_status === 'success' ? 'bg-green-500/10 text-green-600' :
                            log.sync_status === 'failed' ? 'bg-red-500/10 text-red-600' :
                            'bg-blue-500/10 text-blue-600'
                          }>
                            {log.sync_status === 'success' ? 'সফল' : log.sync_status === 'failed' ? 'ব্যর্থ' : 'চলছে'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.records_processed}/{log.records_fetched}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'dd MMM, hh:mm a', { locale: bn })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground font-bangla">
                কোনো সিঙ্ক লগ নেই
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
