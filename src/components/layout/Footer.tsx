import { Link } from 'react-router-dom';
import { GraduationCap, Phone, Mail, MapPin, Facebook, Youtube, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-bangla">আদর্শ বিদ্যালয়</h3>
                <p className="text-sm text-primary-foreground/70">Adarsha Bidyalaya</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed font-bangla">
              শিক্ষার আলোয় আলোকিত করি প্রতিটি জীবন। মানসম্মত শিক্ষা ও নৈতিক মূল্যবোধের বিকাশে আমরা প্রতিশ্রুতিবদ্ধ।
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 font-bangla">দ্রুত লিঙ্ক</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors font-bangla">আমাদের সম্পর্কে</Link>
              </li>
              <li>
                <Link to="/teachers" className="hover:text-accent transition-colors font-bangla">শিক্ষকবৃন্দ</Link>
              </li>
              <li>
                <Link to="/notices" className="hover:text-accent transition-colors font-bangla">নোটিশ বোর্ড</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-accent transition-colors font-bangla">গ্যালারি</Link>
              </li>
              <li>
                <Link to="/admission" className="hover:text-accent transition-colors font-bangla">ভর্তি তথ্য</Link>
              </li>
            </ul>
          </div>

          {/* Portal Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 font-bangla">পোর্টাল</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li>
                <Link to="/auth" className="hover:text-accent transition-colors font-bangla">শিক্ষার্থী পোর্টাল</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-accent transition-colors font-bangla">শিক্ষক পোর্টাল</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-accent transition-colors font-bangla">অভিভাবক পোর্টাল</Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-accent transition-colors font-bangla">প্রশাসন</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4 font-bangla">যোগাযোগ</h4>
            <ul className="space-y-4 text-primary-foreground/80">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-accent" />
                <span className="font-bangla">১২৩ শিক্ষা সড়ক, ঢাকা-১২০০, বাংলাদেশ</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent" />
                <span>+৮৮০ ১২৩৪ ৫৬৭৮৯০</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <span>info@school.edu.bd</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p className="font-bangla">© ২০২৫ আদর্শ বিদ্যালয়। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-accent transition-colors font-bangla">গোপনীয়তা নীতি</Link>
            <Link to="/terms" className="hover:text-accent transition-colors font-bangla">ব্যবহারের শর্তাবলী</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
