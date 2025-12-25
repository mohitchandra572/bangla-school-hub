import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';

const galleryImages = [
  { id: 1, title: 'বার্ষিক ক্রীড়া প্রতিযোগিতা', category: 'অনুষ্ঠান' },
  { id: 2, title: 'বিজ্ঞান মেলা ২০২৫', category: 'শিক্ষা' },
  { id: 3, title: 'স্বাধীনতা দিবস উদযাপন', category: 'অনুষ্ঠান' },
  { id: 4, title: 'ক্লাসরুম কার্যক্রম', category: 'শিক্ষা' },
  { id: 5, title: 'পুরস্কার বিতরণী', category: 'অনুষ্ঠান' },
  { id: 6, title: 'ল্যাবরেটরি', category: 'সুবিধা' },
];

export default function Gallery() {
  return (
    <PublicLayout>
      <section className="relative py-20 hero-gradient text-primary-foreground">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-bangla">ফটো গ্যালারি</h1>
            <p className="text-lg text-primary-foreground/80 font-bangla">আমাদের বিভিন্ন কার্যক্রমের স্মৃতিচিত্র</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div key={image.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="group relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div>
                    <span className="text-xs text-accent font-bangla">{image.category}</span>
                    <h3 className="text-primary-foreground font-semibold font-bangla">{image.title}</h3>
                  </div>
                </div>
                <div className="w-full h-full flex items-center justify-center text-6xl">📷</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
