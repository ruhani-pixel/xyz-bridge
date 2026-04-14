'use client';

import { useState } from 'react';
import { X, Shield, AlertTriangle, ExternalLink, ChevronRight, CheckCircle2, Copy } from 'lucide-react';

interface MSG91SecurityGuideProps {
  isOpen: boolean;
  onClose: () => void;
  errorType?: 'ip_blocked' | 'auth_failed' | 'templates_failed';
}

export function MSG91SecurityGuide({ isOpen, onClose, errorType = 'ip_blocked' }: MSG91SecurityGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const titles: Record<string, string> = {
    ip_blocked: 'API Security (IP Block) Detected',
    auth_failed: 'Auth Key Verification Failed',
    templates_failed: 'Templates Load Nahi Ho Rahe',
  };

  const descriptions: Record<string, string> = {
    ip_blocked: 'MSG91 ne aapke server ka IP block kar diya hai kyunki "API Security" ON hai. Neeche diye steps follow karein taaki aapka connection kaam kare.',
    auth_failed: 'Aapki Auth Key galat hai ya expire ho gayi hai. Neeche diye steps se nayi key generate karein.',
    templates_failed: 'Templates load nahi ho rahe kyunki ya toh API Security ON hai, ya Auth Key sahi nahi hai. Neeche diye steps follow karein.',
  };

  const steps = [
    {
      number: 1,
      title: 'MSG91 Dashboard mein Login karein',
      description: 'MSG91 panel mein jaayein aur apne username dropdown se "Authkey" option select karein. Agar kisi service dashboard ke andar hain toh bottom-left mein bhi mil jayega.',
      highlight: 'Username Dropdown → Authkey',
    },
    {
      number: 2,
      title: 'Mobile Number Verify karein',
      description: 'Apna registered mobile number enter karein aur OTP se verify karein. Ye step zaroori hai Authkey settings access karne ke liye.',
      highlight: 'Registered Number → OTP Verify',
    },
    {
      number: 3,
      title: 'IP Security Toggle OFF karein',
      description: 'Actions tab mein arrow icon par click karein. Wahan ek "IP Security" toggle dikhega — use OFF kar dein. Agar ON rakhna chahte hain toh apne server ka IP whitelist karein.',
      highlight: 'Actions → IP Security Toggle → OFF',
    },
    {
      number: 4,
      title: 'Wapas aayein aur Test karein',
      description: 'Settings mein ye changes save karein, phir wapas yahan aayein aur "Test Connection" button click karein. Ab connection ho jayega!',
      highlight: 'Settings Save → Test Connection ✅',
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 opacity-10" />
          <div className="relative p-8 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200">
                  <Shield className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                    {titles[errorType]}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
                    {descriptions[errorType]}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <strong>Error 418</strong> ka matlab hai ki MSG91 ne API Security enable ki hai.
            Aapko apne MSG91 Dashboard mein jaake IP Security OFF karni hogi ya server IP whitelist karna hoga.
          </p>
        </div>

        {/* Steps */}
        <div className="px-6 pb-4 space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
          {steps.map((step, index) => (
            <button
              key={step.number}
              onClick={() => setCurrentStep(index === currentStep ? -1 : index)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                currentStep === index
                  ? 'bg-slate-50 border-slate-200 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                  currentStep === index 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {step.number}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{step.title}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${
                  currentStep === index ? 'rotate-90' : ''
                }`} />
              </div>
              
              {currentStep === index && (
                <div className="mt-3 ml-11 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <CheckCircle2 className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{step.highlight}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer with Docs Link */}
        <div className="p-6 pt-4 border-t border-slate-100 space-y-3">
          <a
            href="https://msg91.com/help/api/what-do-you-mean-by-api-security"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/20"
          >
            <ExternalLink className="w-4 h-4" />
            MSG91 IP Security Documentation Padhein
          </a>
          <button
            onClick={onClose}
            className="w-full h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Band Karein
          </button>
        </div>
      </div>
    </div>
  );
}
