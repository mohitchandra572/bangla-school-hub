import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Download, Printer, QrCode } from 'lucide-react';

interface AdmitCardPreviewProps {
  student: any;
  exam: any;
  routines: any[];
  admitCard: any;
}

export function AdmitCardPreview({ student, exam, routines, admitCard }: AdmitCardPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>এডমিট কার্ড</title>');
    printWindow.document.write(`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20px; }
        .admit-card { border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
        .school-name { font-size: 24px; font-weight: bold; }
        .exam-name { font-size: 18px; margin-top: 5px; }
        .admit-title { font-size: 20px; font-weight: bold; margin-top: 10px; background: #000; color: #fff; padding: 5px 20px; display: inline-block; }
        .student-info { display: flex; gap: 20px; margin-bottom: 20px; }
        .photo-box { width: 100px; height: 120px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; }
        .info-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { display: flex; gap: 5px; }
        .info-label { font-weight: 600; min-width: 80px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .footer { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #000; }
        .signature { text-align: center; }
        .signature-line { width: 150px; border-top: 1px solid #000; margin-top: 40px; }
        .qr-section { text-align: center; }
        .admit-number { font-size: 14px; margin-top: 5px; }
        .instructions { margin-top: 15px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; }
        .instructions h4 { margin-bottom: 8px; }
        .instructions li { font-size: 12px; margin-left: 20px; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(content.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          <span className="font-bangla">প্রিন্ট</span>
        </Button>
      </div>

      {/* Admit Card Preview */}
      <div ref={printRef} className="border-2 border-foreground p-6 bg-background">
        {/* Header */}
        <div className="text-center border-b-2 border-foreground pb-4 mb-4">
          <h1 className="text-2xl font-bold font-bangla">বিদ্যালয়ের নাম</h1>
          <p className="text-sm text-muted-foreground font-bangla">ঠিকানা: বাংলাদেশ</p>
          <h2 className="text-lg font-semibold font-bangla mt-2">
            {exam.name_bn || exam.name} - {exam.academic_year}
          </h2>
          <div className="inline-block bg-foreground text-background px-6 py-1 mt-2">
            <span className="font-bold font-bangla">প্রবেশপত্র / ADMIT CARD</span>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex gap-6 mb-6">
          <div className="w-24 h-28 border border-foreground flex items-center justify-center bg-muted">
            {student.photo_url ? (
              <img 
                src={student.photo_url} 
                alt="Student" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-muted-foreground font-bangla">ছবি</span>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
            <div className="flex gap-2">
              <span className="font-semibold font-bangla min-w-20">নাম:</span>
              <span className="font-bangla">{student.full_name_bn || student.full_name}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold font-bangla min-w-20">রোল:</span>
              <span className="font-bangla">{student.roll_number}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold font-bangla min-w-20">শ্রেণী:</span>
              <span className="font-bangla">{exam.class}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold font-bangla min-w-20">সেকশন:</span>
              <span className="font-bangla">{student.section || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold font-bangla min-w-20">ভর্তি নং:</span>
              <span>{student.admission_id || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold font-bangla min-w-20">এডমিট নং:</span>
              <span className="text-xs">{admitCard?.admit_number}</span>
            </div>
          </div>
        </div>

        {/* Exam Schedule */}
        <div className="mb-6">
          <h3 className="font-semibold font-bangla mb-2 text-center bg-muted py-1">পরীক্ষার সময়সূচী</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bangla">তারিখ</TableHead>
                <TableHead className="font-bangla">বিষয়</TableHead>
                <TableHead className="font-bangla">সময়</TableHead>
                <TableHead className="font-bangla">পূর্ণমান</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routines.map((routine: any) => (
                <TableRow key={routine.id}>
                  <TableCell className="font-bangla">
                    {format(new Date(routine.exam_date), 'dd MMM yyyy', { locale: bn })}
                  </TableCell>
                  <TableCell className="font-bangla">{routine.subject_bn || routine.subject}</TableCell>
                  <TableCell>{routine.start_time} - {routine.end_time}</TableCell>
                  <TableCell>{routine.total_marks}</TableCell>
                </TableRow>
              ))}
              {routines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground font-bangla">
                    রুটিন এখনো যোগ করা হয়নি
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-3 rounded text-sm mb-6">
          <h4 className="font-semibold font-bangla mb-2">নির্দেশনা:</h4>
          <ul className="list-disc ml-5 space-y-1 font-bangla text-xs">
            <li>পরীক্ষার কক্ষে প্রবেশের ৩০ মিনিট আগে উপস্থিত হতে হবে।</li>
            <li>প্রবেশপত্র ছাড়া পরীক্ষায় অংশগ্রহণ করা যাবে না।</li>
            <li>মোবাইল ফোন বা ইলেকট্রনিক ডিভাইস সম্পূর্ণ নিষিদ্ধ।</li>
            <li>নকল বা অসদুপায় অবলম্বন করলে পরীক্ষা বাতিল হবে।</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-4 border-t border-dashed border-foreground">
          <div className="text-center">
            <div className="w-32 border-t border-foreground mt-10"></div>
            <p className="text-sm font-bangla mt-1">পরীক্ষার্থীর স্বাক্ষর</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 border border-foreground flex items-center justify-center">
              <QrCode className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-xs mt-1">{admitCard?.admit_number}</p>
          </div>
          <div className="text-center">
            <div className="w-32 border-t border-foreground mt-10"></div>
            <p className="text-sm font-bangla mt-1">প্রধান শিক্ষকের স্বাক্ষর</p>
          </div>
        </div>
      </div>
    </div>
  );
}
