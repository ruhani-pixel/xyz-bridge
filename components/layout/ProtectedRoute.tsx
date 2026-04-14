'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isApproved, onboardingComplete, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (pathname !== '/login') router.push('/login');
      } else if (!onboardingComplete && !pathname.startsWith('/onboarding') && !pathname.startsWith('/pricing')) {
        // SaaS flow: force onboarding for users who haven't completed it
        router.push('/onboarding');
      } else if (role === 'agent') {
        // Prevent agents from accessing Head-only pages
        const restrictedPages = ['/ai-config', '/team', '/settings', '/analytics', '/widget', '/onboarding'];
        if (restrictedPages.some(page => pathname.startsWith(page))) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, isApproved, onboardingComplete, loading, router, pathname, role]);

  if (
    loading || 
    (!user && pathname !== '/login') ||
    (!onboardingComplete && !pathname.startsWith('/onboarding') && !pathname.startsWith('/pricing') && !pathname.startsWith('/login'))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-gold" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Solid Models...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
