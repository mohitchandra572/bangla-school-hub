import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'সফল!', description: 'সফলভাবে লগইন হয়েছে' });
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } },
        });
        if (error) throw error;
        toast({ title: 'সফল!', description: 'অ্যাকাউন্ট তৈরি হয়েছে' });
      }
    } catch (error: any) {
      toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12">
        <div className="text-primary-foreground text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <GraduationCap className="w-14 h-14" />
          </div>
          <h1 className="text-4xl font-bold mb-4 font-bangla">আদর্শ বিদ্যালয়</h1>
          <p className="text-primary-foreground/80 font-bangla">স্কুল ম্যানেজমেন্ট সিস্টেম</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 font-bangla">
            <ArrowLeft className="w-4 h-4" /> হোমে ফিরে যান
          </Link>

          <h2 className="text-3xl font-bold mb-2 font-bangla">{isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}</h2>
          <p className="text-muted-foreground mb-8 font-bangla">{isLogin ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div><Label className="font-bangla">পূর্ণ নাম</Label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার নাম" className="pl-10 font-bangla" required /></div></div>
            )}
            <div><Label className="font-bangla">ইমেইল</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="pl-10" required /></div></div>
            <div><Label className="font-bangla">পাসওয়ার্ড</Label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required minLength={6} /></div></div>
            <Button type="submit" className="w-full btn-accent font-bangla" disabled={loading}>{loading ? 'অপেক্ষা করুন...' : isLogin ? 'লগইন' : 'রেজিস্ট্রেশন'}</Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground font-bangla">
            {isLogin ? 'অ্যাকাউন্ট নেই?' : 'ইতিমধ্যে অ্যাকাউন্ট আছে?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-accent hover:underline font-bangla">{isLogin ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
