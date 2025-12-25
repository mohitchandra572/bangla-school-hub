import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const admissionSteps = [
  { step: '১', title: 'অনলাইন আবেদন', description: 'ওয়েবসাইটে ফর্ম পূরণ করুন' },
  { step: '২', title: 'কাগজপত্র জমা', description: 'প্রয়োজনীয় কাগজপত্র জমা দিন' },
  { step: '৩', title: 'ভর্তি পরীক্ষা', description: 'নির্ধারিত তারিখে পরীক্ষা দিন' },
  { step: '৪', title: 'ফলাফল', description: 'ফলাফল প্রকাশের পর ভর্তি সম্পন্ন করুন' },
];

export default function Admission() {
  return (
    <PublicLayout>
      <section className="relative py-20 hero-gradient text-primary-foreground">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-bangla">ভর্তি তথ্য ২০২৬</h1>
            <p className="text-lg text-primary-foreground/80 font-bangla">নতুন শিক্ষাবর্ষের জন্য ভর্তি কার্যক্রম চলছে</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-6 font-bangla">ভর্তি প্রক্রিয়া</h2>
              <div className="space-y-6">
                {admissionSteps.map((item, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex gap-4">
                    <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">{item.step}</div>
                    <div><h4 className="font-semibold text-foreground font-bangla">{item.title}</h4><p className="text-muted-foreground font-bangla">{item.description}</p></div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-border shadow-card">
              <h2 className="text-2xl font-bold mb-6 font-bangla">প্রয়োজনীয় কাগজপত্র</h2>
              <ul className="space-y-3">
                {['জন্ম সনদ', 'পূর্ববর্তী শ্রেণীর সনদপত্র', 'পাসপোর্ট সাইজ ছবি (৪ কপি)', 'অভিভাবকের এনআইডি কপি', 'টিকার সনদ'].map((doc, i) => (
                  <li key={i} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-secondary" /><span className="font-bangla">{doc}</span></li>
                ))}
              </ul>
              <Link to="/auth"><Button className="w-full mt-8 btn-accent font-bangla group">অনলাইন আবেদন করুন<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Button></Link>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
