'use client';

import { useState, useRef, useEffect } from 'react';
import { Contact } from '@/types/contact';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Bot, Send, Paperclip, MoreVertical, ShieldCheck, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatPhone } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { MessageInput } from './MessageInput';
import { toast } from 'sonner';
import { ExportButton } from '@/components/ui/ExportButton';
import { MarkdownText } from '@/components/ui/MarkdownText';

interface ChatWindowProps {
  contact: Contact;
}

export function ChatWindow({ contact }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading } = useMessages(user?.uid, 50);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isTestNumber = contact.phoneNumber === '910000000000';

  // Filter messages for THIS specific contact
  const chatMessages = messages.filter(m => m.contactPhone === contact.phoneNumber).reverse();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, contact.isTyping]);

  const exportChat = () => {
    const data = JSON.stringify(chatMessages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${contact.phoneNumber}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Chat export complete!');
  };

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden border-brand-gold/20">
      
      {/* 1. Header */}
      <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-4">
          <Avatar name={contact.name} size="md" />
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">
              {contact.name || formatPhone(contact.phoneNumber)}
            </h3>
            <div className="flex items-center gap-2">
               {(() => {
                 const isWidget = contact.source === 'widget';
                 const [timeLeft, setTimeLeft] = useState<string>('');
                 
                 useEffect(() => {
                   if (isWidget) return;
                   const calculate = () => {
                     const lastInbound = contact.lastInboundAt?.seconds 
                       ? new Date(contact.lastInboundAt.seconds * 1000) 
                       : null;
                     if (!lastInbound) return;
                     
                     const expiry = lastInbound.getTime() + 24 * 60 * 60 * 1000;
                     const diff = expiry - Date.now();
                     
                     if (diff <= 0) {
                       setTimeLeft('EXPIRED');
                     } else {
                       const hours = Math.floor(diff / (1000 * 60 * 60));
                       const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                       setTimeLeft(`${hours}h ${mins}m left`);
                     }
                   };
                   
                   calculate();
                   const timer = setInterval(calculate, 60000); // Update every minute
                   return () => clearInterval(timer);
                 }, [contact.lastInboundAt]);

                 const isSessionActive = isWidget || isTestNumber || (timeLeft !== 'EXPIRED' && timeLeft !== '');

                 if (isTestNumber) {
                   return (
                     <>
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none text-blue-600">
                         BRIDGE TEST MODE ● ACTIVE
                       </span>
                     </>
                   );
                 }

                 return (
                   <>
                     <div className={cn(
                       "w-1.5 h-1.5 rounded-full", 
                       isSessionActive ? "bg-emerald-500 animate-[pulse_2s_infinite]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                     )} />
                     <span className={cn(
                       "text-[9px] font-black uppercase tracking-[0.15em] leading-none",
                       isSessionActive ? "text-emerald-600" : "text-rose-600"
                     )}>
                       {isWidget ? 'WEBSITE SESSION ● FREE' : (isSessionActive ? `WHATSAPP SESSION ● FREE (${timeLeft})` : 'SESSION EXPIRED ● TEMPLATE REQUIRED')}
                     </span>
                   </>
                 );
               })()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <ExportButton 
             data={chatMessages} 
             filename={`chat_${contact.phoneNumber}_${new Date().toISOString().split('T')[0]}`} 
           />
           <button 
             onClick={async () => {
                const newState = !contact.aiEnabled;
                try {
                   const res = await fetch(`/api/contacts/${contact.id}/ai-toggle`, {
                     method: 'PATCH',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ enabled: newState })
                   });
                   if (!res.ok) {
                     const data = await res.json();
                     throw new Error(data.message || 'AI toggle karne mein error aaya.');
                   }
                   toast.success(`AI Response: ${newState ? 'Chalu (ON) ⚡' : 'Band (OFF)'}`);
                } catch (err: any) {
                   toast.error(err.message || 'AI toggle karne mein error aaya.');
                }
             }}
             className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-xl active:scale-95 cursor-pointer select-none",
             contact.aiEnabled 
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
           )}>
             <div className={cn(
               "w-2 h-2 rounded-full border border-white/40 shadow-[0_0_10px_white]",
               contact.aiEnabled ? "bg-white animate-[pulse_1.5s_infinite] shadow-[0_0_15px_white]" : "bg-white/20"
             )} />
             <Bot className={cn("w-3.5 h-3.5", contact.aiEnabled && "animate-[bounce_2s_infinite]")} />
             {contact.aiEnabled ? 'AI REPLY: ON' : 'AI REPLY: OFF'}
           </button>
           <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* 2. Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        {chatMessages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
             <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-slate-400">Security Encrypted Feed</p>
          </div>
        )}

        {chatMessages.map((msg, idx) => {
          const isMe = msg.direction === 'outbound';
          const isAI = msg.sender === 'ai';
          const showAvatar = idx === 0 || chatMessages[idx-1]?.direction !== msg.direction;

          return (
            <div key={msg.id || idx} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
               <div className={cn("flex gap-3 max-w-[80%]", isMe && "flex-row-reverse")}>
                  {showAvatar && (
                    <div className="flex-shrink-0 mt-auto mb-1">
                      {isMe ? <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">ME</div> : <Avatar name={contact.name} size="sm" />}
                    </div>
                  )}
                  {!showAvatar && <div className="w-8" />}

                  <div className="space-y-1">
                    <div className={cn(
                      "px-6 py-4 rounded-3xl text-[13px] leading-relaxed shadow-sm",
                      isMe 
                        ? "bg-slate-900 text-white rounded-br-none" 
                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-none",
                      isAI && "border-brand-gold/30 ring-1 ring-brand-gold/10"
                    )}>
                      <MarkdownText content={msg.content} />
                    </div>
                    
                    <div className={cn("flex items-center gap-2 px-1", isMe ? "justify-end" : "justify-start")}>
                       {isAI && (
                         <div className="flex items-center gap-1 text-[9px] font-black text-brand-gold uppercase tracking-widest">
                            <Bot className="w-3 h-3" /> GPT-4
                         </div>
                       )}
                       <span className="text-[9px] font-bold text-slate-300 uppercase">
                         {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                       </span>
                       {isMe && <CheckCheck className="w-3 h-3 text-brand-gold opacity-50" />}
                    </div>
                  </div>
               </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {contact.isTyping && (
          <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
             <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 mt-auto mb-1">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Bot className="w-4 h-4 text-brand-gold animate-bounce" />
                   </div>
                </div>
                <div className="space-y-1">
                   <div className="px-6 py-4 rounded-3xl bg-white border border-slate-100 text-slate-400 rounded-bl-none flex items-center gap-2 shadow-sm">
                      <span className="text-[11px] font-bold italic">Solid AI is typing</span>
                      <div className="flex gap-1">
                         <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                         <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                         <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* 3. Input Area */}
      <MessageInput contact={contact} />

      {/* 4. AI Error Alert Modal */}
      {contact.aiError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto border border-rose-100">
                 <ShieldCheck className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter text-rose-600">AI AGENT ERROR</h3>
                 <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none">Configuration Issue Found</p>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                 {contact.aiError}
              </p>
              <div className="pt-2">
                 <Button 
                   onClick={async () => {
                     // Clear the error and turn off AI to prevent loop
                     await fetch(`/api/contacts/${contact.id}/ai-toggle`, {
                       method: 'PATCH',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ enabled: false })
                     });
                     window.location.reload();
                   }}
                   className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                 >
                   Samajh Gaya & Fix Logic
                 </Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

function MessageSquare({ className }: any) {
  return <div className={className}>💬</div>;
}
