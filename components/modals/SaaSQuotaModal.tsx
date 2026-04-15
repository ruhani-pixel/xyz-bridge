'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Wallet, Zap, AlertCircle, ExternalLink, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SaaSQuotaModal() {
  const { adminData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHindi, setIsHindi] = useState(false);

  useEffect(() => {
    if (!adminData) return;

    // Trigger logic
    const isSaasMode = adminData.ai_source_mode === 'saas_ai';
    const freeExhausted = (adminData.saas_free_replies_used || 0) >= (adminData.saas_free_replies_limit || 10);
    const balanceEmpty = (adminData.saas_wallet_balance_inr || 0) <= 0;

    // Show modal if SaaS mode is active but quota + balance is gone
    if (isSaasMode && freeExhausted && balanceEmpty) {
      // Don't show if they are already on the ai-config page trying to recharge
      if (pathname !== '/ai-config') {
          setIsOpen(true);
      } else {
          setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [adminData, pathname]);

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      title=""
    >
      <div className="flex flex-col items-center text-center -mt-4">
        <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Zap className="w-8 h-8 text-brand-gold fill-brand-gold" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
          {isHindi ? 'AI Quota Khatam!' : 'AI Quota Finished!'}
        </h2>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-[280px]">
          {isHindi 
            ? 'Aapke 10 free AI replies khatam ho gaye hain. Humaare premium AI models use karte rehne ke liye wallet me paise add karein.' 
            : 'You have used your 10 free AI replies. To continue using our premium built-in models, please add money to your wallet.'}
        </p>

        <div className="w-full space-y-3 mb-8">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-brand-gold" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Free Replies</span>
                </div>
                <span className="text-xs font-black text-white">10 / 10 Used</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Wallet Balance</span>
                </div>
                <span className="text-xs font-black text-emerald-500">₹0.00</span>
            </div>
        </div>

        <div className="grid grid-cols-1 w-full gap-3">
          <Button 
            className="h-14 rounded-2xl bg-brand-gold hover:bg-brand-gold/90 text-slate-900 font-black uppercase tracking-widest shadow-xl shadow-brand-gold/10 group"
            onClick={() => {
                setIsOpen(false);
                router.push('/ai-config');
            }}
          >
            <Wallet className="mr-2 w-4 h-4" />
            Add Money Now
            <ExternalLink className="ml-2 w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          
          <Button 
            variant="ghost"
            className="h-12 rounded-2xl text-slate-400 hover:text-white font-bold"
            onClick={() => window.open('https://wa.me/918302806913?text=Hi, I need help with AI Recharge', '_blank')}
          >
            <MessageSquare className="mr-2 w-4 h-4" />
            Contact Support
          </Button>

          <button 
            onClick={() => setIsHindi(!isHindi)}
            className="text-[10px] font-black text-brand-gold/60 hover:text-brand-gold uppercase tracking-[0.2em] mt-2 transition-colors"
          >
            {isHindi ? 'Switch to English' : 'Hindi me dekhein'}
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
            <AlertCircle className="w-3 h-3" />
            Secure Payment Powered by PayU
        </div>
      </div>
    </Modal>
  );
}
