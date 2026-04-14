'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Download, Sparkles, Smartphone, Laptop, MoveRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      window.alert('To install: Click your browser menu and select "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('App installed');
    setDeferredPrompt(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          isApproved: true,
          onboardingComplete: false,
          tenantId: user.uid,
          planId: 'free_trial',
          planStatus: 'active',
          messageCount: 0,
          messageLimit: 100,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }

      const idToken = await user.getIdToken();
      document.cookie = `firebase-token=${idToken}; path=/; max-age=3600; SameSite=Strict`;
      localStorage.setItem('token', idToken);

      const updatedSnap = await getDoc(userRef);
      const data = updatedSnap.data();
      
      if (data?.role === 'agent' || data?.onboardingComplete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900 selection:bg-indigo-100">
      {/* LEFT PANEL - Clean, Soft, Artistic */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 relative flex-col justify-between overflow-hidden border-r border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_#f1f5f9_0%,_transparent_100%)]" />
        
        {/* Soft abstract shapes instead of harsh animations */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-100/50 mix-blend-multiply rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-100/50 mix-blend-multiply rounded-full blur-3xl opacity-60" />
        
        <div className="relative z-10 p-12">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center p-2 mb-8">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-slate-900 leading-tight">
            The next generation<br />of WhatsApp CRM.
          </h1>
          <p className="mt-4 text-slate-500 text-lg max-w-md font-light">
            Seamlessly bridge your inbox, empower your team with AI, and scale your business effortlessly.
          </p>
        </div>

        <div className="relative z-10 p-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-200 text-sm font-medium text-slate-600">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Loved by 100+ forward-thinking teams
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-16 bg-white relative">
        <div className="w-full max-w-[400px] space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Sign in</h2>
            <p className="text-slate-500 font-light">
              Welcome back to Solid Models Platform
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={cn(
                "w-full h-12 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98]",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400">or</span></div>
            </div>

            {/* PWA Install Gentle Prompt */}
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Install Desktop App</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Get faster access and native notifications by installing the progressive web app.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleInstallClick}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {deferredPrompt ? 'Install Application' : 'How to install'} 
                <MoveRight className="w-3 h-3" />
              </button>
            </div>

          </div>

          <p className="text-xs text-slate-400 text-center font-light pt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
