import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useState } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, 
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch student info
  const { data: student } = useQuery({
    queryKey: ['student-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch attendance for the month
  const { data: monthlyAttendance, isLoading } = useQuery({
    queryKey: ['student-monthly-attendance', student?.id, selectedDate],
    queryFn: async () => {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student?.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id
  });

  // Calculate stats
  const stats = {
    present: monthlyAttendance?.filter(a => a.status === 'present').length || 0,
    absent: monthlyAttendance?.filter(a => a.status === 'absent').length || 0,
    late: monthlyAttendance?.filter(a => a.status === 'late').length || 0,
    total: monthlyAttendance?.length || 0
  };

  const attendancePercentage = stats.total > 0 
    ? Math.round((stats.present / stats.total) * 100) 
    : 0;

  // Create a map for quick lookup
  const attendanceMap = new Map(
    monthlyAttendance?.map(a => [a.date, a]) || []
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500 font-bangla">উপস্থিত</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="font-bangla">অনুপস্থিত</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500 font-bangla">বিলম্বে</Badge>;
      default:
        return <Badge variant="secondary" className="font-bangla">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">উপস্থিতি রেকর্ড</h1>
          <p className="text-muted-foreground font-bangla">আপনার উপস্থিতির বিস্তারিত তথ্য</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-sm text-muted-foreground font-bangla">উপস্থিত</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-sm text-muted-foreground font-bangla">অনুপস্থিত</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-sm text-muted-foreground font-bangla">বিলম্বে</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${attendancePercentage >= 75 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {attendancePercentage >= 75 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {attendancePercentage}%
                  </p>
                  <p className="text-sm text-muted-foreground font-bangla">উপস্থিতি হার</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bangla flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                মাসিক ক্যালেন্ডার
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  present: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return attendanceMap.get(dateStr)?.status === 'present';
                  },
                  absent: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return attendanceMap.get(dateStr)?.status === 'absent';
                  },
                  late: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return attendanceMap.get(dateStr)?.status === 'late';
                  }
                }}
                modifiersStyles={{
                  present: { backgroundColor: 'hsl(var(--chart-2))', color: 'white' },
                  absent: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
                  late: { backgroundColor: 'hsl(var(--chart-4))', color: 'white' }
                }}
              />
              <div className="flex justify-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="font-bangla">উপস্থিত</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="font-bangla">অনুপস্থিত</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span className="font-bangla">বিলম্বে</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-bangla">
                {format(selectedDate, 'MMMM yyyy', { locale: bn })} - এর উপস্থিতি
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monthlyAttendance && monthlyAttendance.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {monthlyAttendance.map((attendance) => (
                    <div 
                      key={attendance.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(attendance.status)}
                        <div>
                          <p className="font-medium">
                            {format(parseISO(attendance.date), 'EEEE, dd MMMM yyyy', { locale: bn })}
                          </p>
                          {attendance.check_in_time && (
                            <p className="text-sm text-muted-foreground">
                              প্রবেশ: {attendance.check_in_time}
                              {attendance.check_out_time && ` | প্রস্থান: ${attendance.check_out_time}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attendance.source === 'biometric' && (
                          <Badge variant="outline" className="text-xs font-bangla">বায়োমেট্রিক</Badge>
                        )}
                        {getStatusBadge(attendance.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12 font-bangla">
                  এই মাসের কোনো উপস্থিতি রেকর্ড নেই
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
