import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit2, Users, GraduationCap, MessageSquare, FileDown, BarChart3, Zap, Check, X } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  name_bn: string | null;
  max_students: number;
  max_teachers: number;
  features: {
    results?: boolean;
    messaging?: boolean;
    exports?: boolean;
    reports?: boolean;
    api?: boolean;
  };
  max_storage_mb: number;
  price_monthly: number;
  is_active: boolean;
}

const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  results: GraduationCap,
  messaging: MessageSquare,
  exports: FileDown,
  reports: BarChart3,
  api: Zap,
};

const featureLabels: Record<string, string> = {
  results: 'ফলাফল প্রকাশ',
  messaging: 'মেসেজিং',
  exports: 'এক্সপোর্ট',
  reports: 'রিপোর্ট',
  api: 'API অ্যাক্সেস',
};

export default function SubscriptionPlans() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    max_students: 0,
    max_teachers: 0,
    price_monthly: 0,
    max_storage_mb: 1024,
    features: {} as SubscriptionPlan['features'],
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { max_students: number; max_teachers: number; price_monthly: number; max_storage_mb: number; features: SubscriptionPlan['features'] } }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('প্ল্যান আপডেট হয়েছে');
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'আপডেটে সমস্যা হয়েছে');
    },
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      max_students: plan.max_students,
      max_teachers: plan.max_teachers,
      price_monthly: plan.price_monthly,
      max_storage_mb: plan.max_storage_mb,
      features: plan.features || {},
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data: formData });
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature as keyof typeof prev.features],
      },
    }));
  };

  const planColors: Record<string, string> = {
    basic: 'border-gray-200 bg-gray-50',
    standard: 'border-blue-200 bg-blue-50',
    premium: 'border-purple-200 bg-purple-50',
    enterprise: 'border-amber-200 bg-amber-50',
  };

  const planBadgeColors: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-800',
    standard: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-amber-100 text-amber-800',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">সাবস্ক্রিপশন প্ল্যান</h1>
          <p className="text-muted-foreground font-bangla">স্কুলের সাবস্ক্রিপশন প্ল্যান ও সীমা নিয়ন্ত্রণ</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted rounded-t-lg" />
                <CardContent className="space-y-4 pt-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : (
            plans?.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${planColors[plan.name] || ''}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge className={planBadgeColors[plan.name]}>
                      <span className="font-bangla">{plan.name_bn || plan.name}</span>
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    ৳{plan.price_monthly.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/মাস</span>
                  </CardTitle>
                  <CardDescription className="font-bangla">
                    {plan.name === 'enterprise' ? 'কাস্টম সমাধান' : 'স্কুল পরিচালনার জন্য'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Limits */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bangla">
                        শিক্ষার্থী: {plan.max_students === -1 ? 'সীমাহীন' : plan.max_students.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bangla">
                        শিক্ষক: {plan.max_teachers === -1 ? 'সীমাহীন' : plan.max_teachers.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-bangla uppercase">ফিচার</p>
                    {Object.entries(featureLabels).map(([key, label]) => {
                      const isEnabled = plan.features?.[key as keyof typeof plan.features];
                      const Icon = featureIcons[key];
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {isEnabled ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={`font-bangla ${!isEnabled && 'text-muted-foreground'}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-bangla">
                {editingPlan?.name_bn || editingPlan?.name} প্ল্যান সম্পাদনা
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bangla">সর্বোচ্চ শিক্ষার্থী</Label>
                  <Input
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                    placeholder="-1 = সীমাহীন"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bangla">সর্বোচ্চ শিক্ষক</Label>
                  <Input
                    type="number"
                    value={formData.max_teachers}
                    onChange={(e) => setFormData({ ...formData, max_teachers: parseInt(e.target.value) })}
                    placeholder="-1 = সীমাহীন"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bangla">মাসিক মূল্য (৳)</Label>
                  <Input
                    type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bangla">স্টোরেজ (MB)</Label>
                  <Input
                    type="number"
                    value={formData.max_storage_mb}
                    onChange={(e) => setFormData({ ...formData, max_storage_mb: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bangla">ফিচার</Label>
                {Object.entries(featureLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="font-bangla text-sm">{label}</span>
                    <Switch
                      checked={formData.features[key as keyof typeof formData.features] || false}
                      onCheckedChange={() => toggleFeature(key)}
                    />
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <span className="font-bangla">বাতিল</span>
                </Button>
                <Button type="submit">
                  <span className="font-bangla">সংরক্ষণ</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
