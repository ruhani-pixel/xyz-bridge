'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PWAContextType {
  deferredPrompt: any;
  isInstallable: boolean;
  installApp: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  deferredPrompt: null,
  isInstallable: false,
  installApp: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Check reminder logic
      checkReminderLogic();
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check for reminder even if prompt isn't captured yet (periodic)
    const interval = setInterval(checkReminderLogic, 60000); // Check every minute

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, []);

  const checkReminderLogic = () => {
    const isInstalled = localStorage.getItem('pwa_installed') === 'true' || 
                       window.matchMedia('(display-mode: standalone)').matches;

    if (isInstalled) return;

    const lastReminder = localStorage.getItem('pwa_last_reminder');
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (!lastReminder || (now - parseInt(lastReminder)) > ONE_HOUR) {
       // Only show if we actually have the prompt or browser supports it
       setShowReminder(true);
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      window.alert('To install Solid Models: Click your browser menu (three dots or share icon) and select "Install App" or "Add to Home Screen".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
    setShowReminder(false);
  };

  const closeReminder = () => {
    setShowReminder(false);
    localStorage.setItem('pwa_last_reminder', Date.now().toString());
  };

  return (
    <PWAContext.Provider value={{ deferredPrompt, isInstallable, installApp }}>
      {children}
      
      {/* Smart Reminder Popup (Centered Modal) */}
      {showReminder && isInstallable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-8 w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-gold/10 blur-3xl rounded-full" />
              
              <button 
                type="button"
                onClick={closeReminder}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-200 p-2.5 rounded-full z-[999] shadow-sm flex items-center justify-center cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center gap-4 mb-6 relative z-10 pt-2">
                 <div className="w-16 h-16 rounded-3xl bg-brand-gold flex items-center justify-center shadow-xl shadow-brand-gold/30">
                    <Download className="w-8 h-8 text-white" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-slate-900 font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-2">
                       Install App <Sparkles className="w-4 h-4 text-brand-gold" />
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Solid Models Hub</p>
                 </div>
              </div>

              <p className="text-sm text-slate-600 font-medium text-center mb-8 px-2 leading-relaxed relative z-10">
                App install karne se aapko behtar speed aur one-tap access milega. Kya aap ise abhi add karna chahte hain?
              </p>

              <div className="flex flex-col gap-3 relative z-10">
                 <Button 
                    onClick={installApp}
                    className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-black uppercase tracking-widest text-xs h-14 rounded-2xl shadow-xl shadow-brand-gold/20"
                 >
                   Install App Now
                 </Button>
                 <Button 
                    variant="ghost"
                    onClick={closeReminder}
                    className="w-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl"
                 >
                   Skip for now
                 </Button>
              </div>
           </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
