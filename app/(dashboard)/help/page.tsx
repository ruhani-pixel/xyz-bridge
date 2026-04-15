'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  LifeBuoy, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Bot, 
  Users, 
  Download 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const contactOptions = [
    { 
      id: 'call', 
      label: 'Call Us', 
      val: '8302806913', 
      icon: Phone, 
      link: 'tel:8302806913', 
      color: 'bg-brand-gold', 
      sub: 'Mon-Sat, 10AM-6PM' 
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp', 
      val: '8302806913', 
      icon: MessageCircle, 
      link: 'https://wa.me/918302806913', 
      color: 'bg-slate-800', 
      sub: 'Chat for Instant Help' 
    },
    { 
      id: 'email', 
      label: 'Email Support', 
      val: 'info.solidmodels@gmail.com', 
      icon: Mail, 
      link: 'mailto:info.solidmodels@gmail.com', 
      color: 'bg-slate-950', 
      sub: 'Usually 24h Response' 
    },
  ];

  const faqs = [
    { 
      q: "What is Solid Models AI?", 
      a: "Solid Models AI is a next-generation WhatsApp CRM and automation platform. It allows businesses to connect their WhatsApp and use advanced AI (like Gemini and GPT-4) to handle customer queries automatically, 24/7." 
    },
    { 
      q: "How do I connect my WhatsApp account?", 
      a: "Go to the 'Settings & API' tab in your dashboard. You will see a QR code or an option to connect your WhatsApp via our secure bridge. Simply scan it with your phone, and you are live." 
    },
    { 
      q: "How does the 'AI Auto-Reply' toggle work?", 
      a: "The 'All Existing Chats' toggle in the sidebar is your master switch for all current contacts. When it is ON, the AI automatically replies to every existing contact. When it is OFF, all existing chats go to Manual Mode. You can still turn AI on/off for individual chats at any time from inside the Inbox." 
    },
    { 
      q: "What is the 'AI for New Users' toggle?", 
      a: "This is a separate control just below the main AI toggle. It decides what happens when a brand-new contact messages you for the very first time. If it is ON, the AI is automatically enabled for that new contact. If it is OFF, new contacts will start in Manual Mode — even if the main AI switch is ON. This is perfect for SaaS owners who want to review new leads before letting the AI take over." 
    },
    { 
      q: "Can I use my own OpenAI or Gemini API keys?", 
      a: "Absolutely. In the 'AI Setup' page, you can select your provider and paste your own API key. We use server-side encryption to keep your keys 100% safe." 
    },
    { 
      q: "How do I give my AI a specific personality?", 
      a: "Use the 'System Personality / Instructions' box in AI Setup. You can tell the AI who it is (e.g., 'You are a luxury real estate agent') and how it should behave. We provide a default template to help you get started." 
    },
    { 
      q: "Is my customer data secure?", 
      a: "Yes. All messages are stored in an encrypted database. We never share your data with third parties, and even your API keys are encrypted using bank-grade AES-256-CBC algorithms." 
    },
    { 
      q: "How do I invite my team members?", 
      a: "Go to the 'Team' page and use the invite form. Enter your colleague's email, and they will receive a link to join your dashboard with agent access." 
    },
    { 
      q: "Can I turn off AI for just one customer?", 
      a: "Yes. Open the specific customer chat in your 'Inbox'. In the top header, you'll find an 'AI Reply' toggle. Turn it off to handle that specific person manually while keeping AI active for others." 
    },
    { 
      q: "How to export chat history or system logs?", 
      a: "Look for the premium 'Export' button on pages like Inbox, Dashboard, and Analytics. You can download data in Excel (.csv), PDF (Print), or JSON formats." 
    },
    { 
      q: "What is the 'AI Token Limit'?", 
      a: "This setting controls how long the AI's response can be. A higher limit allows longer replies but might consume more of your API quota. We recommend 500-1000 for standard WhatsApp chats." 
    },
    { 
      q: "Does the AI work when my computer is off?", 
      a: "Yes. Solid Models AI is a cloud-based platform. Once configured, the AI works 24/7 on our servers, even if your dashboard is closed." 
    },
    { 
      q: "What is the difference between Gemini 1.5, 2.0, and 2.5?", 
      a: "Gemini 2.0 and 2.5 are the latest, fastest, and most intelligent models from Google. 2.0 is great for standard chats, while 2.5 is even better at reasoning and logic." 
    },
    { 
      q: "How do I install the mobile app?", 
      a: "Click the 'Install App' button at the bottom of the sidebar. On Chrome (Android/Desktop), it will install instantly. On Safari (iOS), use 'Add to Home Screen'." 
    },
    { 
      q: "What is the 'Temperature' setting in AI Setup?", 
      a: "Temperature controls creativity. 0.1 is very factual and consistent, while 0.9 is more creative and human-like. For business use, we recommend 0.4 to 0.7." 
    },
    { 
      q: "How to setup the Website Chat Widget?", 
      a: "Go to the 'Website Widget' page, copy the provided script tag, and paste it before the </body> tag of your website. It will add a WhatsApp bubble that syncs directly with this dashboard." 
    },
    { 
      q: "Can I use this for bulk messaging?", 
      a: "Our platform focuses on 1-on-1 AI-driven conversations and CRM management. For bulk marketing, please check our 'Massive Broadcast' add-on (if available in your plan)." 
    },
    { 
      q: "How do I change my company name?", 
      a: "Head over to 'Settings & API'. Under the 'Business Profile' section, you can update your company name, logo, and other details." 
    },
    { 
      q: "What if the AI makes a mistake?", 
      a: "You can takeover any chat instantly. Simply type a message yourself in the Inbox, and the AI will step back (Manual override)." 
    },
    { 
      q: "Is there a limit on how many messages I can send?", 
      a: "Limits depend on your subscription plan. You can view your current quota and usage on the Dashboard overview." 
    },
    { 
      q: "How can I contact technical support?", 
      a: "Use the cards at the top of this page! You can call us, text us on WhatsApp, or send an email. We are here to help you grow with AI." 
    },
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(search.toLowerCase()) || 
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold/10 rounded-full border border-brand-gold/20">
           <LifeBuoy className="w-4 h-4 text-brand-gold" />
           <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Support 24/7 Center</span>
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">How can we help?</h1>
        <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
          Welcome to Solid Models AI Support hub. Search for tutorials or reach out to our dedicated support team directly.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contactOptions.map((opt) => (
          <a 
            key={opt.id} 
            href={opt.link} 
            target={opt.id === 'whatsapp' ? '_blank' : undefined}
            className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-brand-gold/20 transition-all duration-500 overflow-hidden"
          >
            <div className={cn("absolute top-0 left-0 w-2 h-full transition-all group-hover:w-full opacity-0 group-hover:opacity-[0.03]", opt.color)} />
            
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
               <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", opt.color)}>
                  <opt.icon className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{opt.label}</h3>
                  <p className="text-sm font-black text-slate-900 group-hover:text-brand-gold transition-colors">{opt.val}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 opacity-60">{opt.sub}</p>
               </div>
            </div>
          </a>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
           <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Frequently Asked Questions</h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Found {filteredFaqs.length} relevant answers for you</p>
           </div>
           
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search queries..." 
                className="w-full h-11 pl-11 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-brand-gold/10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="space-y-3 px-2">
           {filteredFaqs.map((faq, idx) => (
             <div 
               key={idx} 
               className={cn(
                 "bg-white border border-slate-100 rounded-3xl overflow-hidden transition-all duration-300",
                 openFaq === idx ? "ring-2 ring-brand-gold/10 border-brand-gold/10" : "hover:border-slate-200"
               )}
             >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left group"
                >
                   <span className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-brand-gold transition-colors">
                     {faq.q}
                   </span>
                   {openFaq === idx ? <ChevronUp className="w-5 h-5 text-brand-gold" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                     <p className="text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-4">
                        {faq.a}
                     </p>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Footer Support Prompt */}
      <div className="bg-slate-950 rounded-[3rem] p-12 overflow-hidden relative group border border-slate-900 shadow-2xl">
         <div className="absolute inset-0 bg-brand-gold opacity-0 group-hover:opacity-[0.05] transition-opacity duration-1000" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Still have questions?</h3>
               <p className="text-slate-400 text-sm font-medium max-w-md">
                 Cant find what you are looking for? Our executive relationship managers are available to guide you 1-on-1.
               </p>
            </div>
            <a 
              href="tel:8302806913"
              className="px-10 py-5 bg-brand-gold text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all"
            >
               Connect with Humans
            </a>
         </div>
         {/* Decorative elements */}
         <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
