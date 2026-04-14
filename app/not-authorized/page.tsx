'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function NotAuthorizedPage() {
  const router = useRouter();
  const { user, loading, onboardingComplete } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!onboardingComplete) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, onboardingComplete, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-gold" />
        <p className="text-[10px] font-black text-white uppercase tracking-widest">Redirecting...</p>
      </div>
    </div>
  );
}
