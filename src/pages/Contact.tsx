import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <PublicLayout>
      <section className="relative py-20 hero-gradient text-primary-foreground">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-bangla">যোগাযোগ করুন</h1>
            <p className="text-lg text-primary-foreground/80 font-bangla">আমাদের সাথে যোগাযোগ করতে নিচের ফর্মটি পূরণ করুন</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold mb-6 font-bangla">যোগাযোগের তথ্য</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><MapPin className="w-6 h-6 text-primary" /></div><div><h4 className="font-semibold font-bangla">ঠিকানা</h4><p className="text-muted-foreground font-bangla">১২৩ শিক্ষা সড়ক, ঢাকা-১২০০</p></div></div>
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><Phone className="w-6 h-6 text-primary" /></div><div><h4 className="font-semibold font-bangla">ফোন</h4><p className="text-muted-foreground">+৮৮০ ১২৩৪ ৫৬৭৮৯০</p></div></div>
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><Mail className="w-6 h-6 text-primary" /></div><div><h4 className="font-semibold font-bangla">ইমেইল</h4><p className="text-muted-foreground">info@school.edu.bd</p></div></div>
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-primary" /></div><div><h4 className="font-semibold font-bangla">অফিস সময়</h4><p className="text-muted-foreground font-bangla">রবি - বৃহঃ: সকাল ৮টা - বিকাল ৪টা</p></div></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-border shadow-card">
              <h2 className="text-2xl font-bold mb-6 font-bangla">মেসেজ পাঠান</h2>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input placeholder="আপনার নাম" className="font-bangla" />
                  <Input type="email" placeholder="ইমেইল" />
                </div>
                <Input placeholder="বিষয়" className="font-bangla" />
                <Textarea placeholder="আপনার মেসেজ লিখুন..." rows={5} className="font-bangla" />
                <Button className="w-full btn-accent font-bangla">মেসেজ পাঠান</Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
