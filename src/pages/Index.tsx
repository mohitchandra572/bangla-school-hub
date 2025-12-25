import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/PublicLayout';

const stats = [
  { icon: Users, value: '২৫০০+', label: 'শিক্ষার্থী', labelEn: 'Students' },
  { icon: BookOpen, value: '১২০+', label: 'শিক্ষক', labelEn: 'Teachers' },
  { icon: Award, value: '৯৫%', label: 'সাফল্যের হার', labelEn: 'Success Rate' },
  { icon: Clock, value: '৫০+', label: 'বছরের অভিজ্ঞতা', labelEn: 'Years' },
];

const features = [
  {
    title: 'মানসম্মত শিক্ষা',
    titleEn: 'Quality Education',
    description: 'অভিজ্ঞ শিক্ষকমণ্ডলী দ্বারা আধুনিক পাঠ্যক্রম অনুসরণ করে শিক্ষাদান',
    icon: '📚',
  },
  {
    title: 'ডিজিটাল ক্লাসরুম',
    titleEn: 'Digital Classroom',
    description: 'প্রযুক্তি নির্ভর শিক্ষা ব্যবস্থা ও স্মার্ট ক্লাসরুম সুবিধা',
    icon: '💻',
  },
  {
    title: 'সহ-পাঠ্যক্রমিক কার্যক্রম',
    titleEn: 'Co-curricular Activities',
    description: 'খেলাধুলা, সাংস্কৃতিক কার্যক্রম ও বিভিন্ন ক্লাব সুবিধা',
    icon: '🎨',
  },
  {
    title: 'নিরাপদ পরিবেশ',
    titleEn: 'Safe Environment',
    description: 'সিসিটিভি নজরদারি ও সুরক্ষিত ক্যাম্পাস পরিবেশ',
    icon: '🛡️',
  },
];

const notices = [
  {
    id: 1,
    title: 'বার্ষিক পরীক্ষার সময়সূচী প্রকাশ',
    date: '২৫ ডিসেম্বর, ২০২৫',
    category: 'পরীক্ষা',
  },
  {
    id: 2,
    title: 'শীতকালীন ছুটির নোটিশ',
    date: '২০ ডিসেম্বর, ২০২৫',
    category: 'ছুটি',
  },
  {
    id: 3,
    title: 'বার্ষিক ক্রীড়া প্রতিযোগিতা',
    date: '১৫ ডিসেম্বর, ২০২৫',
    category: 'অনুষ্ঠান',
  },
];

const Index = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-primary-foreground space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full text-sm">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="font-bangla">ভর্তি চলছে ২০২৬</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-bangla">
                স্বপ্নের পথে
                <span className="block text-gradient">এগিয়ে যাও</span>
              </h1>
              
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-xl font-bangla">
                মানসম্মত শিক্ষা, নৈতিক মূল্যবোধ ও আধুনিক প্রযুক্তির সমন্বয়ে গড়ে তুলছি আগামীর প্রজন্ম। আমাদের সাথে শুরু করুন আপনার সন্তানের সাফল্যের যাত্রা।
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/admission">
                  <Button size="lg" className="btn-accent font-bangla text-lg px-8 group">
                    এখনই ভর্তি হন
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="btn-outline-light font-bangla text-lg px-8">
                    আরও জানুন
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="w-80 h-80 mx-auto bg-primary-foreground/10 rounded-full flex items-center justify-center animate-float">
                  <div className="w-64 h-64 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                    <div className="w-48 h-48 bg-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-8xl">🎓</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-10 -left-10 bg-card rounded-2xl p-4 shadow-elevated animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-bangla">১ম স্থান</p>
                      <p className="text-sm text-muted-foreground font-bangla">বোর্ড পরীক্ষা</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-10 -right-10 bg-card rounded-2xl p-4 shadow-elevated animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-bangla">২৫০০+</p>
                      <p className="text-sm text-muted-foreground font-bangla">শিক্ষার্থী</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 -mt-20 relative z-10">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="stats-card card-hover"
              >
                <stat.icon className="w-10 h-10 mx-auto mb-4 text-accent" />
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className="text-muted-foreground font-bangla">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">কেন আমাদের বিদ্যালয়?</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              আমরা শুধু পড়াই না, শেখাই জীবনের পাঠ। আমাদের বিশেষ সুবিধাসমূহ দেখুন।
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 card-hover border border-border"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-foreground font-bangla">{feature.title}</h3>
                <p className="text-muted-foreground text-sm font-bangla">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Notice Board Preview */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">সাম্প্রতিক নোটিশ</h2>
              <p className="section-subtitle">
                সর্বশেষ ঘোষণা ও গুরুত্বপূর্ণ তথ্য
              </p>

              <div className="space-y-4">
                {notices.map((notice, index) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="notice-card card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs rounded-full mb-2 font-bangla">
                          {notice.category}
                        </span>
                        <h4 className="font-semibold text-foreground font-bangla">{notice.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 font-bangla">{notice.date}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-accent flex-shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link to="/notices" className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all mt-6 font-bangla">
                সব নোটিশ দেখুন
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary rounded-3xl p-8 text-primary-foreground"
            >
              <h3 className="text-2xl font-bold mb-4 font-bangla">ভর্তি তথ্য ২০২৬</h3>
              <p className="text-primary-foreground/80 mb-6 font-bangla">
                নতুন শিক্ষাবর্ষের জন্য ভর্তি কার্যক্রম চলছে। এখনই আবেদন করুন এবং আপনার সন্তানের উজ্জ্বল ভবিষ্যত নিশ্চিত করুন।
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 font-bangla">
                  <span className="w-2 h-2 bg-accent rounded-full" />
                  প্লে গ্রুপ থেকে দশম শ্রেণী
                </li>
                <li className="flex items-center gap-3 font-bangla">
                  <span className="w-2 h-2 bg-accent rounded-full" />
                  সীমিত আসন সংখ্যা
                </li>
                <li className="flex items-center gap-3 font-bangla">
                  <span className="w-2 h-2 bg-accent rounded-full" />
                  অনলাইন আবেদন সুবিধা
                </li>
              </ul>

              <Link to="/admission">
                <Button size="lg" className="w-full btn-accent font-bangla group">
                  ভর্তির আবেদন করুন
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="section-title mb-4">আপনার সন্তানের ভবিষ্যত গড়ে তুলুন</h2>
            <p className="section-subtitle mb-8">
              আজই আমাদের সাথে যোগাযোগ করুন এবং জানুন কীভাবে আমরা আপনার সন্তানের সাফল্যে সহায়তা করতে পারি।
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" className="btn-accent font-bangla text-lg px-8">
                  যোগাযোগ করুন
                </Button>
              </Link>
              <Link to="/gallery">
                <Button size="lg" variant="outline" className="font-bangla text-lg px-8">
                  গ্যালারি দেখুন
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
