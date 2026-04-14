'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, UserPlus, ArrowRight, Bot, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const inviteId = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (!inviteId) return;
    
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      const res = await fetch('/api/user/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inviteId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join team');

      toast.success('Successfully joined the team! Redirecting...');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!inviteId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Invalid Invitation</h1>
          <p className="text-slate-500">This invite link is invalid or has expired. Please ask your administrator for a new one.</p>
          <Button variant="outline" onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-900 selection:bg-brand-gold/10">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_#1e293b_0%,_transparent_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[120px]" />
        
        <div className="relative z-10 p-16">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center p-2.5 mb-10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white leading-[1.1] uppercase italic">
            YOU'VE BEEN<br />INVITED TO JOIN<br />THE ELITE.
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-md font-medium leading-relaxed">
            Join your team on Solid Models and start managing WhatsApp conversations with the power of AI.
          </p>
        </div>

        <div className="relative z-10 p-16 flex items-center gap-6">
           <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                  U{i}
                </div>
              ))}
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Sparkles className="w-3 h-3 text-brand-gold" /> 100+ Teams active right now
           </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-[440px] space-y-12">
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">
               <Bot className="w-3 h-3" /> Team Access Request
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-950 uppercase italic">Join Your Team</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Sign in with your work email to accept the invitation and access the WhatsApp AI Dashboard.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center p-3">
                    <UserPlus className="w-full h-full text-brand-gold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Employee Portal</h4>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Access Shared Inbox & AI Tools</p>
                  </div>
               </div>

               <Button 
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-8 bg-slate-950 hover:bg-slate-900 text-white rounded-3xl flex items-center justify-center gap-4 group transition-all active:scale-[0.98] shadow-2xl shadow-slate-950/20"
               >
                 <span className="text-base font-black uppercase tracking-widest font-display">Sign in with Google</span>
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
               <ShieldCheck className="w-3 h-3" /> Secure Enterprise Authentication
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-bold uppercase tracking-tight max-w-[280px] mx-auto leading-relaxed">
            By joining, you agree to follow your company’s communication policies.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-gold rounded-full animate-spin" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
