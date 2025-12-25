import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Mail, Award, BookOpen } from 'lucide-react';

const teachers = [
  { id: 1, name: 'প্রফেসর মোহাম্মদ আব্দুল করিম', designation: 'অধ্যক্ষ', department: 'প্রশাসন', qualification: 'এমএ, বিএড' },
  { id: 2, name: 'ড. ফাতেমা বেগম', designation: 'উপাধ্যক্ষ', department: 'বিজ্ঞান', qualification: 'পিএইচডি' },
  { id: 3, name: 'মোঃ রফিকুল ইসলাম', designation: 'সিনিয়র শিক্ষক', department: 'গণিত', qualification: 'এমএসসি' },
  { id: 4, name: 'সাবিনা ইয়াসমিন', designation: 'শিক্ষক', department: 'বাংলা', qualification: 'এমএ' },
  { id: 5, name: 'মোঃ আনোয়ার হোসেন', designation: 'শিক্ষক', department: 'ইংরেজি', qualification: 'এমএ' },
  { id: 6, name: 'নাজমা আক্তার', designation: 'শিক্ষক', department: 'সমাজবিজ্ঞান', qualification: 'এমএসএস' },
];

export default function Teachers() {
  return (
    <PublicLayout>
      <section className="relative py-20 hero-gradient text-primary-foreground">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-bangla">আমাদের শিক্ষকবৃন্দ</h1>
            <p className="text-lg text-primary-foreground/80 font-bangla">অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকমণ্ডলী</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher, index) => (
              <motion.div key={teacher.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-card rounded-2xl p-6 border border-border shadow-soft card-hover text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-4xl">👨‍🏫</div>
                <h3 className="font-semibold text-lg text-foreground font-bangla">{teacher.name}</h3>
                <p className="text-accent font-medium font-bangla">{teacher.designation}</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" /><span className="font-bangla">{teacher.department}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Award className="w-4 h-4" /><span className="font-bangla">{teacher.qualification}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
