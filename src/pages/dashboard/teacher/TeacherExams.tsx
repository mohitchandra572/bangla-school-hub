import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useState } from 'react';
import { 
  Calendar, Clock, MapPin, BookOpen, 
  CheckCircle2, AlertCircle, ClipboardList
} from 'lucide-react';

export default function TeacherExams() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('all');

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

  // Fetch exams for assigned classes
  const { data: exams, isLoading } = useQuery({
    queryKey: ['teacher-exams', teacher?.assigned_classes],
    queryFn: async () => {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .in('class', teacher?.assigned_classes || [])
        .order('start_date', { ascending: false });
      if (examError) throw examError;
      
      // Fetch exam routines for each exam
      const examsWithRoutines = await Promise.all(
        (examData || []).map(async (exam) => {
          const { data: routines } = await supabase
            .from('exam_routines')
            .select('*')
            .eq('exam_id', exam.id)
            .order('exam_date', { ascending: true });
          return { ...exam, exam_routines: routines || [] };
        })
      );
      
      return examsWithRoutines;
    },
    enabled: !!(teacher?.assigned_classes && teacher.assigned_classes.length > 0)
  });

  // Filter exams by class
  const filteredExams = exams?.filter(e => 
    selectedClass === 'all' || e.class === selectedClass
  ) || [];

  const upcomingExams = filteredExams.filter(e => isFuture(parseISO(e.start_date)) || isToday(parseISO(e.start_date)));
  const pastExams = filteredExams.filter(e => isPast(parseISO(e.start_date)) && !isToday(parseISO(e.start_date)));

  const getExamTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'term': 'সেমিস্টার পরীক্ষা',
      'midterm': 'মিড-টার্ম পরীক্ষা',
      'annual': 'বার্ষিক পরীক্ষা',
      'class_test': 'ক্লাস টেস্ট'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="font-bangla">সম্পন্ন</Badge>;
      case 'ongoing':
        return <Badge className="bg-green-500 font-bangla">চলমান</Badge>;
      default:
        return <Badge variant="outline" className="font-bangla">আসন্ন</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-bangla">পরীক্ষার সময়সূচি</h1>
            <p className="text-muted-foreground font-bangla">আপনার শ্রেণির পরীক্ষাসমূহ</p>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px] font-bangla">
              <SelectValue placeholder="শ্রেণি নির্বাচন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bangla">সকল শ্রেণি</SelectItem>
              {teacher?.assigned_classes?.map((cls: string) => (
                <SelectItem key={cls} value={cls} className="font-bangla">
                  {cls} শ্রেণি
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingExams.length}</p>
                  <p className="text-sm text-muted-foreground font-bangla">আসন্ন পরীক্ষা</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pastExams.length}</p>
                  <p className="text-sm text-muted-foreground font-bangla">সম্পন্ন পরীক্ষা</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teacher?.assigned_classes?.length || 0}</p>
                  <p className="text-sm text-muted-foreground font-bangla">শ্রেণি</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exams List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="space-y-4">
            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold font-bangla mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  আসন্ন পরীক্ষা
                </h2>
                <div className="space-y-4">
                  {upcomingExams.map((exam) => (
                    <Card key={exam.id}>
                      <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <CardTitle className="font-bangla text-lg">
                              {exam.name_bn || exam.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground font-bangla mt-1">
                              {exam.class} শ্রেণি {exam.section && `• ${exam.section} শাখা`} • {getExamTypeLabel(exam.exam_type)}
                            </p>
                          </div>
                          {getStatusBadge(exam.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(parseISO(exam.start_date), 'dd MMM', { locale: bn })}</span>
                            {exam.end_date && (
                              <span> - {format(parseISO(exam.end_date), 'dd MMM yyyy', { locale: bn })}</span>
                            )}
                          </div>
                        </div>

                        {exam.exam_routines && exam.exam_routines.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium font-bangla mb-3 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              বিষয়ভিত্তিক সময়সূচি
                            </h4>
                            <div className="grid gap-2">
                              {exam.exam_routines
                                .map((routine: any) => {
                                  const examDate = parseISO(routine.exam_date);
                                  const isExamToday = isToday(examDate);
                                  const isExamPast = isPast(examDate) && !isExamToday;
                                  
                                  return (
                                    <div 
                                      key={routine.id} 
                                      className={`flex items-center justify-between p-3 rounded-lg ${
                                        isExamToday ? 'bg-primary/10 border border-primary' : 
                                        isExamPast ? 'bg-muted/30' : 'bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        {isExamPast ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : isExamToday ? (
                                          <AlertCircle className="h-5 w-5 text-primary" />
                                        ) : (
                                          <Calendar className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                          <p className="font-medium font-bangla">{routine.subject_bn || routine.subject}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {format(examDate, 'EEEE, dd MMMM', { locale: bn })}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">{routine.start_time} - {routine.end_time}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          {routine.room_no && (
                                            <span className="flex items-center gap-1">
                                              <MapPin className="h-3 w-3" />
                                              {routine.room_no}
                                            </span>
                                          )}
                                          <span>{routine.total_marks} নম্বর</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Exams */}
            {pastExams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold font-bangla mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  সম্পন্ন পরীক্ষা
                </h2>
                <div className="grid gap-3">
                  {pastExams.slice(0, 5).map((exam) => (
                    <Card key={exam.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium font-bangla">{exam.name_bn || exam.name}</p>
                            <p className="text-sm text-muted-foreground font-bangla">
                              {exam.class} শ্রেণি • {getExamTypeLabel(exam.exam_type)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(exam.start_date), 'dd MMM yyyy', { locale: bn })}
                            </p>
                            {getStatusBadge(exam.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-bangla">কোনো পরীক্ষা নেই</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
