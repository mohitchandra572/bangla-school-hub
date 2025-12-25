import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Calendar, Tag, ArrowRight, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const categories = ['সকল', 'পরীক্ষা', 'ছুটি', 'অনুষ্ঠান', 'ভর্তি', 'সাধারণ'];

// Static notices for demo
const staticNotices = [
  {
    id: '1',
    title: 'বার্ষিক পরীক্ষার সময়সূচী প্রকাশ',
    title_bn: 'বার্ষিক পরীক্ষার সময়সূচী প্রকাশ',
    content: 'সকল শিক্ষার্থীদের জানানো যাচ্ছে যে, ২০২৫ সালের বার্ষিক পরীক্ষার সময়সূচী প্রকাশ করা হয়েছে। বিস্তারিত সময়সূচী অফিস থেকে সংগ্রহ করুন।',
    content_bn: 'সকল শিক্ষার্থীদের জানানো যাচ্ছে যে, ২০২৫ সালের বার্ষিক পরীক্ষার সময়সূচী প্রকাশ করা হয়েছে।',
    category: 'পরীক্ষা',
    published_at: '2025-12-25T10:00:00Z',
  },
  {
    id: '2',
    title: 'শীতকালীন ছুটির নোটিশ',
    title_bn: 'শীতকালীন ছুটির নোটিশ',
    content: 'আগামী ২৮ ডিসেম্বর থেকে ৫ জানুয়ারি পর্যন্ত বিদ্যালয় বন্ধ থাকবে। ৬ জানুয়ারি থেকে স্বাভাবিক ক্লাস শুরু হবে।',
    content_bn: 'আগামী ২৮ ডিসেম্বর থেকে ৫ জানুয়ারি পর্যন্ত বিদ্যালয় বন্ধ থাকবে।',
    category: 'ছুটি',
    published_at: '2025-12-20T10:00:00Z',
  },
  {
    id: '3',
    title: 'বার্ষিক ক্রীড়া প্রতিযোগিতা',
    title_bn: 'বার্ষিক ক্রীড়া প্রতিযোগিতা',
    content: 'আগামী ১৫ জানুয়ারি বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে। সকল শিক্ষার্থীদের অংশগ্রহণ কাম্য।',
    content_bn: 'আগামী ১৫ জানুয়ারি বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে।',
    category: 'অনুষ্ঠান',
    published_at: '2025-12-15T10:00:00Z',
  },
  {
    id: '4',
    title: 'ভর্তি কার্যক্রম ২০২৬ শুরু',
    title_bn: 'ভর্তি কার্যক্রম ২০২৬ শুরু',
    content: 'নতুন শিক্ষাবর্ষ ২০২৬ এর জন্য ভর্তি কার্যক্রম শুরু হয়েছে। আগ্রহী অভিভাবকগণ অফিসে যোগাযোগ করুন।',
    content_bn: 'নতুন শিক্ষাবর্ষ ২০২৬ এর জন্য ভর্তি কার্যক্রম শুরু হয়েছে।',
    category: 'ভর্তি',
    published_at: '2025-12-10T10:00:00Z',
  },
  {
    id: '5',
    title: 'অভিভাবক সভার আমন্ত্রণ',
    title_bn: 'অভিভাবক সভার আমন্ত্রণ',
    content: 'আগামী ১০ জানুয়ারি বিকাল ৩টায় অভিভাবক সভা অনুষ্ঠিত হবে। সকল অভিভাবকদের উপস্থিতি কাম্য।',
    content_bn: 'আগামী ১০ জানুয়ারি বিকাল ৩টায় অভিভাবক সভা অনুষ্ঠিত হবে।',
    category: 'সাধারণ',
    published_at: '2025-12-05T10:00:00Z',
  },
];

export default function Notices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সকল');

  const { data: dbNotices } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const notices = dbNotices && dbNotices.length > 0 ? dbNotices : staticNotices;

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = notice.title_bn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'সকল' || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
              নোটিশ বোর্ড
            </h1>
            <p className="text-lg text-primary-foreground/80 font-bangla">
              সর্বশেষ ঘোষণা, পরীক্ষার সময়সূচী ও গুরুত্বপূর্ণ তথ্য
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="নোটিশ খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-bangla"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="font-bangla"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notices List */}
      <section className="py-16">
        <div className="container">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-bangla text-lg">কোনো নোটিশ পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredNotices.map((notice, index) => (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-soft card-hover"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full font-bangla">
                          <Tag className="w-3 h-3" />
                          {notice.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="font-bangla">{formatDate(notice.published_at || '')}</span>
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-foreground mb-3 font-bangla">
                        {notice.title_bn || notice.title}
                      </h3>
                      
                      <p className="text-muted-foreground font-bangla leading-relaxed">
                        {notice.content_bn || notice.content}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
