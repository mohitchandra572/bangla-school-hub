import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, ChevronLeft, ChevronRight, Download, 
  CheckCircle, XCircle, Clock, CalendarDays, TrendingUp, User
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { bn } from 'date-fns/locale';

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  present: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  absent: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  late: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  leave: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const statusLabels: Record<string, string> = {
  present: 'উপস্থিত',
  absent: 'অনুপস্থিত',
  late: 'বিলম্বে',
  leave: 'ছুটি',
};

export default function ParentAttendanceHistory() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Fetch parent's children
  const { data: children } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, full_name_bn, class, section, roll_number, photo_url')
        .eq('parent_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-select first child
  const currentStudentId = selectedStudentId || children?.[0]?.id;

  // Fetch attendance for selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['parent-attendance', currentStudentId, format(selectedMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', currentStudentId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!currentStudentId,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!attendance) return { present: 0, absent: 0, late: 0, leave: 0, total: 0, percentage: 0 };
    
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const leave = attendance.filter(a => a.status === 'leave').length;
    const total = attendance.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, leave, total, percentage };
  }, [attendance]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map(day => {
      const record = attendance?.find(a => isSameDay(new Date(a.date), day));
      return {
        date: day,
        status: record?.status || null,
        record,
      };
    });
  }, [attendance, monthStart, monthEnd]);

  const selectedStudent = children?.find(c => c.id === currentStudentId);

  const handleExportPDF = () => {
    // Would trigger PDF generation
    console.log('Export PDF for', currentStudentId, format(selectedMonth, 'yyyy-MM'));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">উপস্থিতির ইতিহাস</h1>
            <p className="text-muted-foreground font-bangla">
              আপনার সন্তানের মাসিক উপস্থিতি রিপোর্ট
            </p>
          </div>
          <Button variant="outline" onClick={handleExportPDF} className="font-bangla">
            <Download className="w-4 h-4 mr-2" />
            PDF ডাউনলোড
          </Button>
        </div>

        {/* Student Selector (if multiple children) */}
        {children && children.length > 1 && (
          <Card>
            <CardContent className="p-4">
              <Select value={currentStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="সন্তান নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <span className="font-bangla">
                        {child.full_name_bn || child.full_name} - {child.class} ({child.roll_number})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Selected Student Info */}
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedStudent.photo_url ? (
                      <img src={selectedStudent.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold font-bangla">
                      {selectedStudent.full_name_bn || selectedStudent.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-bangla">
                      {selectedStudent.class} শ্রেণি{selectedStudent.section && `, ${selectedStudent.section} শাখা`} | রোল: {selectedStudent.roll_number}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
              <p className="text-sm text-green-600 font-bangla">উপস্থিত</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
              <p className="text-sm text-red-600 font-bangla">অনুপস্থিত</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
              <p className="text-sm text-yellow-600 font-bangla">বিলম্বে</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <CalendarDays className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-700">{stats.leave}</p>
              <p className="text-sm text-blue-600 font-bangla">ছুটি</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30 col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">{stats.percentage}%</p>
              <p className="text-sm text-primary font-bangla">হার</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="font-bangla">
                {format(selectedMonth, 'MMMM yyyy', { locale: bn })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map((day) => (
                <div key={day} className="text-center text-xs text-muted-foreground font-bangla py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Actual days */}
              {calendarDays.map(({ date, status }) => {
                const isToday = isSameDay(date, new Date());
                const statusStyle = status ? statusColors[status] : null;
                
                return (
                  <motion.div
                    key={date.toISOString()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                      transition-all cursor-pointer hover:scale-105
                      ${statusStyle ? statusStyle.bg : 'bg-muted/30'}
                      ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    <span className={`font-medium ${statusStyle ? statusStyle.text : 'text-muted-foreground'}`}>
                      {format(date, 'd')}
                    </span>
                    {status && (
                      <div className={`w-2 h-2 rounded-full mt-1 ${statusStyle?.dot}`} />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t justify-center">
              {Object.entries(statusColors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${value.dot}`} />
                  <span className="text-sm font-bangla">{statusLabels[key]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-bangla">বিস্তারিত তালিকা</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : attendance?.length === 0 ? (
              <p className="text-center text-muted-foreground font-bangla py-8">
                এই মাসে কোনো উপস্থিতি রেকর্ড নেই
              </p>
            ) : (
              <div className="space-y-2">
                {attendance?.map((record) => {
                  const statusStyle = statusColors[record.status];
                  return (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${statusStyle.bg}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusStyle.dot}`} />
                        <div>
                          <p className="font-medium font-bangla">
                            {format(new Date(record.date), 'dd MMMM, EEEE', { locale: bn })}
                          </p>
                          {record.check_in_time && (
                            <p className="text-xs text-muted-foreground font-bangla">
                              প্রবেশ: {record.check_in_time}
                              {record.check_out_time && ` | প্রস্থান: ${record.check_out_time}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0`}>
                        {statusLabels[record.status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
