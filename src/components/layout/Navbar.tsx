import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, GraduationCap, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'হোম', nameBn: 'হোম', href: '/' },
  { name: 'আমাদের সম্পর্কে', nameBn: 'আমাদের সম্পর্কে', href: '/about' },
  { name: 'নোটিশ বোর্ড', nameBn: 'নোটিশ বোর্ড', href: '/notices' },
  { name: 'শিক্ষকবৃন্দ', nameBn: 'শিক্ষকবৃন্দ', href: '/teachers' },
  { name: 'ভর্তি', nameBn: 'ভর্তি', href: '/admission' },
  { name: 'গ্যালারি', nameBn: 'গ্যালারি', href: '/gallery' },
  { name: 'যোগাযোগ', nameBn: 'যোগাযোগ', href: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 hidden md:block">
        <div className="container flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a href="tel:+8801234567890" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone className="w-4 h-4" />
              <span>+৮৮০ ১২৩৪ ৫৬৭৮৯০</span>
            </a>
            <a href="mailto:info@school.edu.bd" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="w-4 h-4" />
              <span>info@school.edu.bd</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="hover:text-accent transition-colors">
              লগইন / রেজিস্ট্রেশন
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="glass border-b border-border/50">
        <div className="container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-foreground font-bangla">আদর্শ বিদ্যালয়</h1>
                <p className="text-xs text-muted-foreground">Adarsha Bidyalaya</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-bangla ${
                    location.pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {link.nameBn}
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
              <Link to="/auth">
                <Button className="btn-accent font-bangla">
                  পোর্টালে প্রবেশ করুন
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border/50 bg-card"
            >
              <div className="container py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 font-bangla ${
                      location.pathname === link.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.nameBn}
                  </Link>
                ))}
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button className="w-full btn-accent font-bangla mt-4">
                    পোর্টালে প্রবেশ করুন
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
