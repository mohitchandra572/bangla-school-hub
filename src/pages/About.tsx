import { motion } from 'framer-motion';
import { CheckCircle, Target, Heart, Award, BookOpen, Users } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';

const milestones = [
  { year: '১৯৭৫', event: 'বিদ্যালয় প্রতিষ্ঠা', eventEn: 'School Founded' },
  { year: '১৯৯০', event: 'উচ্চ মাধ্যমিক শাখা চালু', eventEn: 'Higher Secondary Added' },
  { year: '২০১০', event: 'ডিজিটাল ক্লাসরুম চালু', eventEn: 'Digital Classrooms' },
  { year: '২০২০', event: 'অনলাইন শিক্ষা প্ল্যাটফর্ম', eventEn: 'Online Platform' },
  { year: '২০২৫', event: 'স্মার্ট স্কুল রূপান্তর', eventEn: 'Smart School' },
];

const values = [
  {
    icon: BookOpen,
    title: 'শিক্ষার উৎকর্ষতা',
    description: 'মানসম্মত ও আধুনিক শিক্ষা প্রদানে আমরা প্রতিশ্রুতিবদ্ধ।',
  },
  {
    icon: Heart,
    title: 'নৈতিক মূল্যবোধ',
    description: 'সততা, সম্মান ও দায়িত্ববোধ শেখানো আমাদের মূল লক্ষ্য।',
  },
  {
    icon: Users,
    title: 'সামাজিক দায়বদ্ধতা',
    description: 'সমাজের প্রতি দায়িত্বশীল নাগরিক তৈরিতে আমরা কাজ করি।',
  },
  {
    icon: Target,
    title: 'লক্ষ্য অর্জন',
    description: 'প্রতিটি শিক্ষার্থীর স্বপ্ন পূরণে সহায়তা করাই আমাদের কাজ।',
  },
];

export default function About() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 hero-gradient text-primary-foreground">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-bangla">
              আমাদের সম্পর্কে
            </h1>
            <p className="text-lg text-primary-foreground/80 font-bangla">
              ৫০ বছরের বেশি সময় ধরে শিক্ষার আলো ছড়িয়ে দিচ্ছে আদর্শ বিদ্যালয়।
              মানসম্মত শিক্ষা ও নৈতিক মূল্যবোধের বিকাশে আমরা প্রতিশ্রুতিবদ্ধ।
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl p-8 border border-border shadow-card"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground font-bangla">আমাদের লক্ষ্য</h2>
              <p className="text-muted-foreground leading-relaxed font-bangla">
                প্রতিটি শিক্ষার্থীকে জ্ঞান, দক্ষতা ও মূল্যবোধে সমৃদ্ধ করে তোলা এবং তাদের সুপ্ত 
                প্রতিভার বিকাশ ঘটিয়ে দেশ ও জাতির সেবায় যোগ্য নাগরিক হিসেবে গড়ে তোলাই আমাদের 
                প্রধান লক্ষ্য। আমরা বিশ্বাস করি প্রতিটি শিশু অনন্য এবং তাদের নিজস্ব গতিতে শেখার 
                সুযোগ দেওয়া উচিত।
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl p-8 border border-border shadow-card"
            >
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground font-bangla">আমাদের দৃষ্টিভঙ্গি</h2>
              <p className="text-muted-foreground leading-relaxed font-bangla">
                একটি আধুনিক, প্রযুক্তিনির্ভর ও মূল্যবোধ সম্পন্ন শিক্ষা প্রতিষ্ঠান হিসেবে দেশের 
                শীর্ষস্থানীয় বিদ্যালয়ে পরিণত হওয়া। আমরা এমন একটি শিক্ষা পরিবেশ তৈরি করতে চাই 
                যেখানে শিক্ষার্থীরা স্বাধীনভাবে চিন্তা করতে, সৃজনশীল হতে এবং নেতৃত্ব দিতে শিখবে।
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">আমাদের মূল্যবোধ</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              এই মূল্যবোধগুলো আমাদের পথ দেখায় এবং প্রতিটি সিদ্ধান্তে সাহায্য করে।
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center card-hover border border-border"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground font-bangla">{value.title}</h3>
                <p className="text-muted-foreground text-sm font-bangla">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">আমাদের যাত্রা</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              ৫০ বছরের গৌরবময় ইতিহাস ও অর্জনের গল্প
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-border" />
            
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center mb-8 ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
                    <span className="text-2xl font-bold text-accent">{milestone.year}</span>
                    <h4 className="font-semibold text-foreground mt-2 font-bangla">{milestone.event}</h4>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-accent rounded-full border-4 border-background z-10" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Principal Message */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-64 h-64 mx-auto lg:mx-0 rounded-3xl bg-primary-foreground/10 flex items-center justify-center">
                <span className="text-8xl">👨‍🏫</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4 font-bangla">অধ্যক্ষের বাণী</h2>
              <p className="text-primary-foreground/80 leading-relaxed mb-6 font-bangla">
                "শিক্ষা শুধু বই পড়া নয়, জীবনের জন্য প্রস্তুতি। আমাদের বিদ্যালয়ে আমরা প্রতিটি 
                শিক্ষার্থীকে শুধু পড়াশোনায় দক্ষ করে তুলি না, বরং তাদের মানবিক মূল্যবোধ, নেতৃত্বের 
                গুণাবলী ও সামাজিক দায়িত্ববোধ শেখাই। আমাদের লক্ষ্য হলো এমন মানুষ তৈরি করা যারা 
                দেশ ও জাতির সেবায় নিবেদিতপ্রাণ হবে।"
              </p>
              <div>
                <p className="font-bold text-lg font-bangla">প্রফেসর মোহাম্মদ আব্দুল করিম</p>
                <p className="text-primary-foreground/70 font-bangla">অধ্যক্ষ, আদর্শ বিদ্যালয়</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
