'use client';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-6">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-brand-gold/5 blur-3xl opacity-50 mix-blend-multiply" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-3xl opacity-50 mix-blend-multiply" />
        </div>
        
        <div className="relative w-full max-w-4xl z-10">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
