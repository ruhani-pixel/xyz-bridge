'use client';

import { useState } from 'react';
import { 
  X, Shield, AlertTriangle, ExternalLink, 
  ChevronRight, CheckCircle2, Copy, Search, 
  Laptop, Key, Mail, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

interface GmailSecurityGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GmailSecurityGuide({ isOpen, onClose }: GmailSecurityGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      title: 'Google Security Search',
      description: 'Apne Google Account mein jaayein. Search bar mein "App Passwords" likh kar search karein.',
      highlight: 'Chrome → Google Account → Security',
      icon: Search,
      actionHint: 'Search "App Passwords"'
    },
    {
      number: 2,
      title: 'App Password Settings',
      description: 'Agar search result mile, toh us par click karein. Aapko apna password enter karke verify karna pad sakta hai.',
      highlight: 'Select "App Passwords" result',
      icon: Lock,
      actionHint: 'Enter Account Password'
    },
    {
      number: 3,
      title: 'Generate 16-Digit Code',
      description: 'App ka naam dein (e.g., "Solid Models") aur "Create" par click karein. Aapko ek 16-character ka yellow box mein code dikhega.',
      highlight: 'Give Name → Click Create',
      icon: Key,
      actionHint: 'Copy the 16-char code'
    },
    {
      number: 4,
      title: 'Paste & Connect',
      description: 'Us code ko copy karein aur yahan dashboard settings mein "App Password" field mein paste karke save karein.',
      highlight: 'Paste Here → Save Settings ✅',
      icon: CheckCircle2,
      actionHint: 'Done! 🎉'
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-slate-900 p-10 text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Mail className="w-32 h-32 rotate-12" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-tight">
                  Gmail Setup <span className="text-red-500">Protocol</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
                  Secure SMTP Configuration Guide
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-10">
           {/* Progress Bar */}
           <div className="flex gap-2 mb-10">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-700",
                    i <= currentStep ? "bg-red-500" : "bg-slate-100"
                  )}
                />
              ))}
           </div>

           {/* Steps Content */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                 {steps.map((step, index) => (
                    <button
                      key={step.number}
                      onClick={() => setCurrentStep(index)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all duration-500 group",
                        currentStep === index
                          ? 'bg-slate-50 border-slate-200 shadow-sm scale-[1.02]'
                          : 'bg-white border-transparent hover:bg-slate-50/50'
                      )}
                    >
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                            currentStep === index ? "bg-red-500 text-white shadow-lg rotate-12" : "bg-slate-100 text-slate-400"
                          )}>
                             {step.number}
                          </div>
                          <div>
                             <p className={cn("text-[11px] font-black uppercase tracking-widest", currentStep === index ? "text-slate-900" : "text-slate-400")}>
                                {step.title}
                             </p>
                          </div>
                       </div>
                    </button>
                 ))}
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
                 <div className="absolute top-4 right-4 text-[6rem] font-black text-slate-200/20 pointer-events-none">
                    {steps[currentStep].number}
                 </div>
                 <div className="relative z-10 space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 text-red-500">
                       {(() => {
                         const Icon = steps[currentStep].icon;
                         return <Icon className="w-7 h-7" />;
                       })()}
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                       {steps[currentStep].description}
                    </p>
                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Key Hint:</span>
                       <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">{steps[currentStep].highlight}</span>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                       <div className="px-3 py-1 bg-red-50 text-[10px] font-black text-red-500 rounded-lg uppercase tracking-tight">
                          {steps[currentStep].actionHint}
                       </div>
                       {currentStep < steps.length - 1 && (
                         <button 
                           onClick={() => setCurrentStep(prev => prev + 1)}
                           className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 group"
                         >
                           Next Step <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                         </button>
                       )}
                    </div>
                 </div>
              </div>
           </div>

           {/* Footer Action */}
           <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <a 
                href="https://myaccount.google.com/security" 
                target="_blank" 
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                <ExternalLink className="w-4 h-4" /> Open Google Security Settings
              </a>
              <Button 
                onClick={onClose}
                className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
              >
                Got it, Start Setup
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
