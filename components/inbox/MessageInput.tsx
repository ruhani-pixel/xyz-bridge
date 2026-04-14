'use client';

import { useState, useRef } from 'react';
import { Contact } from '@/types/contact';
import { Send, Paperclip, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StartChatModal } from './StartChatModal';

interface MessageInputProps {
  contact: Contact;
}

export function MessageInput({ contact }: MessageInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lastInbound = contact.lastInboundAt?.seconds 
    ? new Date(contact.lastInboundAt.seconds * 1000) 
    : null;
  
  const isExpired = contact.source === 'whatsapp' && 
                    (!lastInbound || (Date.now() - lastInbound.getTime()) > 24 * 60 * 60 * 1000);

  const handleSend = async () => {
    if (!text.trim() || loading || isExpired) return;

    setLoading(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id, // Using ID for robust lookup
          phoneNumber: contact.phoneNumber,
          content: text.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (error) {
       console.error('Send Error:', error);
       toast.error('Galti ho gayi... Reply nahi gaya.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  if (isExpired) {
    return (
      <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center gap-3 text-rose-500">
           <AlertCircle className="w-5 h-5" />
           <p className="text-[11px] font-black uppercase tracking-widest italic">Personal Chat Expired (24h Over)</p>
        </div>
        <p className="text-[10px] font-bold text-slate-400 text-center px-20 leading-relaxed uppercase tracking-widest">
           Aapka free chat session khatam ho gaya hai. Agla message bhejne ke liye "Template" ka istemal karein.
        </p>
        <button 
          onClick={() => setIsTemplateModalOpen(true)}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-brand-gold" /> Re-open Session With Template
        </button>
        <StartChatModal 
          isOpen={isTemplateModalOpen} 
          onClose={() => setIsTemplateModalOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border-t border-slate-50">
      <div className="relative group">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Apne vichar likhein..."
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-4 pl-6 pr-32 text-sm font-medium focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/30 outline-none transition-all resize-none min-h-[56px] max-h-[200px]"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
        />

        <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
           <button className="p-2.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
             <Paperclip className="w-5 h-5" />
           </button>
           <button className="p-2.5 text-brand-gold hover:bg-brand-gold/10 rounded-2xl transition-all">
             <Sparkles className="w-5 h-5" />
           </button>
           <button 
             onClick={handleSend}
             disabled={!text.trim() || loading}
             className={cn(
               "p-3 rounded-2xl transition-all shadow-lg flex items-center justify-center",
               text.trim() 
                ? "bg-slate-900 text-white shadow-slate-900/20 hover:scale-105 active:scale-95" 
                : "bg-slate-100 text-slate-300 shadow-none cursor-not-allowed"
             )}
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
           </button>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-4 px-2">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Use Shift + Enter for new line
         </p>
         <div className="h-3 w-px bg-slate-100" />
         <button className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">
           Magic Reply (AI)
         </button>
      </div>
    </div>
  );
}
