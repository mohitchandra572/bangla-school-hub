import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  Calendar, Clock, MapPin, BookOpen, 
  CheckCircle2, AlertCircle
} from 'lucide-react';

export default function StudentExams() {
  const { user } = useAuth();

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

  // Fetch exams for student's class
  const { data: exams, isLoading } = useQuery({
    queryKey: ['student-exams', student?.class],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          exam_routines(*)
        `)
        .eq('class', student?.class)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.class
  });

  const upcomingExams = exams?.filter(e => isFuture(parseISO(e.start_date)) || isToday(parseISO(e.start_date))) || [];
  const pastExams = exams?.filter(e => isPast(parseISO(e.start_date)) && !isToday(parseISO(e.start_date))) || [];

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'term':
        return 'সেমিস্টার পরীক্ষা';
      case 'midterm':
        return 'মিড-টার্ম পরীক্ষা';
      case 'annual':
        return 'বার্ষিক পরীক্ষা';
      case 'class_test':
        return 'ক্লাস টেস্ট';
      default:
        return type;
    }
  };

  const renderExamCard = (exam: any, showRoutine: boolean = true) => (
    <Card key={exam.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-bangla text-lg">{exam.name_bn || exam.name}</CardTitle>
            <p className="text-sm text-muted-foreground font-bangla mt-1">
              {getExamTypeLabel(exam.exam_type)}
            </p>
          </div>
          <Badge 
            variant={exam.status === 'completed' ? 'secondary' : exam.status === 'ongoing' ? 'default' : 'outline'}
            className="font-bangla"
          >
            {exam.status === 'completed' ? 'সম্পন্ন' : exam.status === 'ongoing' ? 'চলমান' : 'আসন্ন'}
          </Badge>
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
          {exam.academic_year && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{exam.academic_year}</span>
            </div>
          )}
        </div>

        {showRoutine && exam.exam_routines && exam.exam_routines.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium font-bangla mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              পরীক্ষার সময়সূচি
            </h4>
            <div className="space-y-2">
              {exam.exam_routines
                .sort((a: any, b: any) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
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
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-bangla">পরীক্ষার সময়সূচি</h1>
          <p className="text-muted-foreground font-bangla">
            {student?.class} শ্রেণি {student?.section && `- ${student?.section} শাখা`}
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="font-bangla">
            <TabsTrigger value="upcoming">আসন্ন পরীক্ষা ({upcomingExams.length})</TabsTrigger>
            <TabsTrigger value="past">পূর্ববর্তী পরীক্ষা ({pastExams.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingExams.length > 0 ? (
              <div className="grid gap-4">
                {upcomingExams.map((exam) => renderExamCard(exam))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো আসন্ন পরীক্ষা নেই</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastExams.length > 0 ? (
              <div className="grid gap-4">
                {pastExams.map((exam) => renderExamCard(exam, false))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bangla">কোনো পূর্ববর্তী পরীক্ষা নেই</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
