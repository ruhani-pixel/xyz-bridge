'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Bot, MessageSquare, Loader2, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function WidgetChatContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  const primaryColor = searchParams.get('color') || '#C5A059';
  const greeting = searchParams.get('greeting') || 'Hi! How can we help you today? 👋';

  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vid = localStorage.getItem(`sm_visitor_${tenantId}`);
    if (!vid) {
      vid = `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(`sm_visitor_${tenantId}`, vid);
    }
    setVisitorId(vid);

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/widget-chat?tenantId=${tenantId}&visitorId=${vid}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{
            id: 'greeting',
            direction: 'outbound',
            sender: 'ai',
            content: greeting,
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId && vid) {
      fetchHistory();
      const pollInterval = setInterval(fetchHistory, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [tenantId, greeting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = {
      id: Date.now().toString(),
      direction: 'inbound',
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      await fetch('/api/widget-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          visitorId,
          message: input
        })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!tenantId) {
    return <div className="p-10 text-center font-bold text-rose-500">Invalid Config</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden selection:bg-brand-gold/20 font-sans">
      
      {/* 1. Header (Premium Mesh Gradient) */}
      <div 
        className="px-6 py-6 shrink-0 flex items-center justify-between text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)` }}
      >
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
           <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-gold/20 rounded-full blur-[100px]" />
           <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-white p-1 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
             <img src="/logopro.png" alt="Logo" className="w-full h-full object-contain rounded-[1rem]" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-none mb-1 shadow-sm">Live Assistant</h1>
            <div className="flex items-center gap-1.5 ">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite] shadow-[0_0_8px_white]" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active & Secure</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 opacity-30 hover:opacity-100 transition-opacity cursor-help">
           <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Messages (Geometric Background) */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative custom-scrollbar"
      >
        {/* Technical Grid Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" />

        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
               <Loader2 className="w-6 h-6 text-brand-gold animate-spin" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Feed</span>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isMe = msg.direction === 'inbound';
                const isAI = msg.sender === 'ai';
                return (
                  <motion.div 
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                  >
                    <div className={cn(
                      "max-w-[88%] px-5 py-3.5 rounded-3xl text-[13px] font-medium leading-relaxed shadow-sm transition-all",
                      isMe 
                        ? "bg-slate-900 text-white rounded-br-none shadow-slate-900/10" 
                        : "bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-[0_4px_15px_rgba(0,0,0,0.02)]",
                      isAI && "border-brand-gold/20 ring-1 ring-brand-gold/5"
                    )}>
                      {msg.content}
                    </div>
                    <div className={cn("flex items-center gap-2 mt-1.5 px-1 uppercase tracking-tighter", isMe ? "flex-row-reverse" : "flex-row")}>
                       {isAI && <span className="text-[8px] font-black text-brand-gold flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI</span>}
                       <span className="text-[8px] font-black text-slate-300">
                         {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                       </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 3. Input (Floating Glass Pill) */}
      <div className="p-6 bg-white border-t border-slate-50">
        <form onSubmit={handleSend} className="relative group">
           <div className="absolute inset-0 bg-brand-gold/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
           <input 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Apne vichar likhein..."
             className="w-full h-14 bg-slate-50 border border-slate-100/50 rounded-2xl px-6 pr-14 text-sm font-bold placeholder:text-slate-300 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/30 transition-all relative z-10"
           />
           <button 
             disabled={!input.trim() || sending}
             className={cn(
               "absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all z-20",
               input.trim() ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 active:scale-90" : "bg-slate-100 text-slate-300 translate-x-1 opacity-0 pointer-events-none"
             )}
           >
             {sending ? <Loader2 className="w-4 h-4 animate-spin text-brand-gold" /> : <Send className="w-4 h-4" />}
           </button>
        </form>
        <div className="flex items-center justify-center gap-4 mt-6">
           <div className="h-px flex-1 bg-slate-50" />
           <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.3em]">
              Elite Security <span className="text-emerald-500/30">●</span> Verified AI
           </p>
           <div className="h-px flex-1 bg-slate-50" />
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
        body { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
}

function ShieldCheck({ className }: any) {
  return <div className={className}>🛡️</div>;
}

export default function WidgetChatPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 text-brand-gold animate-spin" /></div>}>
      <WidgetChatContent />
    </Suspense>
  );
}
