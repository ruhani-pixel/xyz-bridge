'use client';

import { Mail, Phone, ExternalLink, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function GmailSupportPage() {
  const faqs = [
    {
      q: "How many emails can I send per day?",
      a: "With a standard Gmail account, you can send up to 500 emails per day. We recommend keeping campaigns under 450 to avoid any Google blocks."
    },
    {
      q: "Where do I get my App Password?",
      a: "1. Pehle apna 2-Step Verification ON kar lo Google account me. \n2. Uske baad https://myaccount.google.com/ par jao. Vaha search bar me 'App Passwords' search karo aur us par click karo. \n3. App ka naam de do kuch bhi (jaise 'SolidModels') aur Create par click karo. \n4. Uske baad aapko kuch digits ka code milega. Usko yaha settings me paste kar do, aur jis Gmail ka hai, us email id ko paste karke save kar do, aur connect ho jayega!"
    },
    {
      q: "Will my emails go to Spam?",
      a: "Our system sends legitimate emails through your own Google account, which gives them incredibly high inbox placement. However, avoid spam words, don't use too many links, and ensure recipients actually want your emails."
    },
    {
      q: "Can I use Excel sheets for campaigns?",
      a: "Yes! Use the Templates page to download our Excel Format. You can pre-fill 500 contacts with custom subjects and body messages and upload it into the Campaign Wizard."
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">
            Help & <span className="text-red-500">Support</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
            Get help with your Gmail campaigns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-slate-50 pb-5 last:border-0 last:pb-0">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 leading-snug">{faq.q}</h3>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-tight mb-2 text-white">Need Direct Help?</h3>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-6">
                Our support team is available via WhatsApp and Phone for prompt assistance with your campaigns.
              </p>

              <div className="space-y-3">
                <a 
                  href="https://wa.me/918302806913" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">WhatsApp Support</p>
                      <p className="text-xs font-bold text-white">+91 8302806913</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </a>

                <a 
                  href="mailto:info.solidmodels@gmail.com" 
                  className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Support</p>
                      <p className="text-[10px] font-bold text-white truncate">info.solidmodels@gmail.com</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
