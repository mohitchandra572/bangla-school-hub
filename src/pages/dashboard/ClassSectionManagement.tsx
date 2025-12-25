import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, BookOpen, Layers, GraduationCap } from 'lucide-react';

const defaultClasses = [
  { id: '1', name: '১ম', name_en: 'Class 1', sections: ['ক', 'খ'], students: 45 },
  { id: '2', name: '২য়', name_en: 'Class 2', sections: ['ক', 'খ', 'গ'], students: 62 },
  { id: '3', name: '৩য়', name_en: 'Class 3', sections: ['ক', 'খ'], students: 55 },
  { id: '4', name: '৪র্থ', name_en: 'Class 4', sections: ['ক', 'খ', 'গ'], students: 68 },
  { id: '5', name: '৫ম', name_en: 'Class 5', sections: ['ক', 'খ'], students: 50 },
  { id: '6', name: '৬ষ্ঠ', name_en: 'Class 6', sections: ['ক', 'খ', 'গ', 'ঘ'], students: 85 },
  { id: '7', name: '৭ম', name_en: 'Class 7', sections: ['ক', 'খ', 'গ'], students: 72 },
  { id: '8', name: '৮ম', name_en: 'Class 8', sections: ['ক', 'খ', 'গ'], students: 70 },
  { id: '9', name: '৯ম', name_en: 'Class 9', sections: ['ক', 'খ'], students: 48 },
  { id: '10', name: '১০ম', name_en: 'Class 10', sections: ['ক', 'খ'], students: 42 },
];

const defaultSubjects = [
  { id: '1', name: 'বাংলা', name_en: 'Bangla', code: 'BAN', classes: ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'] },
  { id: '2', name: 'ইংরেজি', name_en: 'English', code: 'ENG', classes: ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'] },
  { id: '3', name: 'গণিত', name_en: 'Mathematics', code: 'MATH', classes: ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'] },
  { id: '4', name: 'বিজ্ঞান', name_en: 'Science', code: 'SCI', classes: ['৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম'] },
  { id: '5', name: 'সমাজ বিজ্ঞান', name_en: 'Social Science', code: 'SOC', classes: ['৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'] },
  { id: '6', name: 'ধর্ম', name_en: 'Religion', code: 'REL', classes: ['১ম', '২য়', '৩য়', '৪র্থ', '৫ম', '৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'] },
  { id: '7', name: 'পদার্থবিজ্ঞান', name_en: 'Physics', code: 'PHY', classes: ['৯ম', '১০ম'] },
  { id: '8', name: 'রসায়ন', name_en: 'Chemistry', code: 'CHE', classes: ['৯ম', '১০ম'] },
  { id: '9', name: 'জীববিজ্ঞান', name_en: 'Biology', code: 'BIO', classes: ['৯ম', '১০ম'] },
  { id: '10', name: 'উচ্চতর গণিত', name_en: 'Higher Math', code: 'HM', classes: ['৯ম', '১০ম'] },
  { id: '11', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', name_en: 'ICT', code: 'ICT', classes: ['৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'] },
];

export default function ClassSectionManagement() {
  const { user } = useAuth();
  const [classes, setClasses] = useState(defaultClasses);
  const [subjects, setSubjects] = useState(defaultSubjects);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  
  const [classForm, setClassForm] = useState({ name: '', name_en: '', sections: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', name_en: '', code: '', classes: [] as string[] });

  // Get student counts per class from database
  const { data: studentCounts } = useQuery({
    queryKey: ['student-counts-by-class'],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('class')
        .eq('status', 'active');
      
      const counts: Record<string, number> = {};
      data?.forEach(s => {
        counts[s.class] = (counts[s.class] || 0) + 1;
      });
      return counts;
    },
  });

  const handleSaveClass = () => {
    if (!classForm.name || !classForm.name_en) {
      toast.error('ক্লাসের নাম দিন');
      return;
    }

    const sections = classForm.sections.split(',').map(s => s.trim()).filter(Boolean);
    
    if (editingClass) {
      setClasses(classes.map(c => 
        c.id === editingClass.id 
          ? { ...c, name: classForm.name, name_en: classForm.name_en, sections }
          : c
      ));
      toast.success('ক্লাস আপডেট হয়েছে');
    } else {
      setClasses([...classes, {
        id: Date.now().toString(),
        name: classForm.name,
        name_en: classForm.name_en,
        sections,
        students: 0,
      }]);
      toast.success('নতুন ক্লাস যোগ হয়েছে');
    }
    
    setIsClassDialogOpen(false);
    setEditingClass(null);
    setClassForm({ name: '', name_en: '', sections: '' });
  };

  const handleSaveSubject = () => {
    if (!subjectForm.name || !subjectForm.code) {
      toast.error('বিষয়ের নাম ও কোড দিন');
      return;
    }

    if (editingSubject) {
      setSubjects(subjects.map(s => 
        s.id === editingSubject.id 
          ? { ...s, ...subjectForm }
          : s
      ));
      toast.success('বিষয় আপডেট হয়েছে');
    } else {
      setSubjects([...subjects, {
        id: Date.now().toString(),
        ...subjectForm,
      }]);
      toast.success('নতুন বিষয় যোগ হয়েছে');
    }
    
    setIsSubjectDialogOpen(false);
    setEditingSubject(null);
    setSubjectForm({ name: '', name_en: '', code: '', classes: [] });
  };

  const handleEditClass = (cls: any) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      name_en: cls.name_en,
      sections: cls.sections.join(', '),
    });
    setIsClassDialogOpen(true);
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      name_en: subject.name_en,
      code: subject.code,
      classes: subject.classes,
    });
    setIsSubjectDialogOpen(true);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('আপনি কি এই ক্লাস মুছে ফেলতে চান?')) {
      setClasses(classes.filter(c => c.id !== id));
      toast.success('ক্লাস মুছে ফেলা হয়েছে');
    }
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('আপনি কি এই বিষয় মুছে ফেলতে চান?')) {
      setSubjects(subjects.filter(s => s.id !== id));
      toast.success('বিষয় মুছে ফেলা হয়েছে');
    }
  };

  const totalStudents = Object.values(studentCounts || {}).reduce((sum, count) => sum + count, 0);
  const totalSections = classes.reduce((sum, c) => sum + c.sections.length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-bangla">ক্লাস, সেকশন ও বিষয় ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground font-bangla mt-1">
            একাডেমিক কাঠামো পরিচালনা করুন
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট ক্লাস</p>
                  <p className="text-2xl font-bold">{classes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট সেকশন</p>
                  <p className="text-2xl font-bold">{totalSections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট বিষয়</p>
                  <p className="text-2xl font-bold">{subjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-bangla">মোট শিক্ষার্থী</p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="classes" className="font-bangla">ক্লাস ও সেকশন</TabsTrigger>
            <TabsTrigger value="subjects" className="font-bangla">বিষয়সমূহ</TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-bangla">ক্লাস তালিকা</CardTitle>
                  <CardDescription className="font-bangla">সকল ক্লাস ও সেকশন</CardDescription>
                </div>
                <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingClass(null); setClassForm({ name: '', name_en: '', sections: '' }); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="font-bangla">নতুন ক্লাস</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-bangla">{editingClass ? 'ক্লাস সম্পাদনা' : 'নতুন ক্লাস যোগ করুন'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-bangla">ক্লাসের নাম (বাংলা)</Label>
                        <Input
                          value={classForm.name}
                          onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                          placeholder="যেমন: ৬ষ্ঠ"
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">ক্লাসের নাম (ইংরেজি)</Label>
                        <Input
                          value={classForm.name_en}
                          onChange={(e) => setClassForm({...classForm, name_en: e.target.value})}
                          placeholder="e.g., Class 6"
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">সেকশনসমূহ (কমা দিয়ে আলাদা করুন)</Label>
                        <Input
                          value={classForm.sections}
                          onChange={(e) => setClassForm({...classForm, sections: e.target.value})}
                          placeholder="যেমন: ক, খ, গ"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                        <span className="font-bangla">বাতিল</span>
                      </Button>
                      <Button onClick={handleSaveClass}>
                        <span className="font-bangla">{editingClass ? 'আপডেট' : 'যোগ করুন'}</span>
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">ক্লাস</TableHead>
                      <TableHead className="font-bangla">সেকশনসমূহ</TableHead>
                      <TableHead className="font-bangla">শিক্ষার্থী</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium font-bangla">{cls.name} শ্রেণী</p>
                            <p className="text-sm text-muted-foreground">{cls.name_en}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {cls.sections.map((section: string) => (
                              <Badge key={section} variant="secondary" className="font-bangla">
                                {section}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {studentCounts?.[cls.name] || 0} জন
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClass(cls)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(cls.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-bangla">বিষয় তালিকা</CardTitle>
                  <CardDescription className="font-bangla">সকল বিষয় ও তাদের ক্লাস বিন্যাস</CardDescription>
                </div>
                <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingSubject(null); setSubjectForm({ name: '', name_en: '', code: '', classes: [] }); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="font-bangla">নতুন বিষয়</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-bangla">{editingSubject ? 'বিষয় সম্পাদনা' : 'নতুন বিষয় যোগ করুন'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-bangla">বিষয়ের নাম (বাংলা)</Label>
                        <Input
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                          placeholder="যেমন: গণিত"
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">বিষয়ের নাম (ইংরেজি)</Label>
                        <Input
                          value={subjectForm.name_en}
                          onChange={(e) => setSubjectForm({...subjectForm, name_en: e.target.value})}
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      <div>
                        <Label className="font-bangla">বিষয় কোড</Label>
                        <Input
                          value={subjectForm.code}
                          onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value.toUpperCase()})}
                          placeholder="e.g., MATH"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                        <span className="font-bangla">বাতিল</span>
                      </Button>
                      <Button onClick={handleSaveSubject}>
                        <span className="font-bangla">{editingSubject ? 'আপডেট' : 'যোগ করুন'}</span>
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bangla">বিষয়</TableHead>
                      <TableHead className="font-bangla">কোড</TableHead>
                      <TableHead className="font-bangla">প্রযোজ্য ক্লাস</TableHead>
                      <TableHead className="font-bangla text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium font-bangla">{subject.name}</p>
                            <p className="text-sm text-muted-foreground">{subject.name_en}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {subject.classes.slice(0, 5).map((cls: string) => (
                              <Badge key={cls} variant="secondary" className="font-bangla text-xs">
                                {cls}
                              </Badge>
                            ))}
                            {subject.classes.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{subject.classes.length - 5}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSubject(subject)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}