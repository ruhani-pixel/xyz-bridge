'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, MessageSquare, Send, Phone, User, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StartChatModal({ isOpen, onClose }: StartChatModalProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/whatsapp/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.templates) {
        // Filter only approved templates
        const approved = data.templates.filter((t: any) => t.status === 'APPROVED');
        setTemplates(approved);
      }
    } catch (error) {
      console.error('Template Fetch Error:', error);
      toast.error('Galti ho gayi... Templates nahi mil pa rahe.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !selectedTemplate) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/send-template', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phoneNumber: phone.replace(/\D/g, ''),
          name: name || phone,
          templateName: selectedTemplate,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      toast.success('Pehla message (Template) bhej diya gaya! ✅');
      onClose();
      // Optionally trigger a refresh or navigation
      window.location.reload(); 
    } catch (error) {
      console.error('Send Template Error:', error);
      toast.error('Message nahi gaya. Phone number check karein.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-lg bg-white border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Nayi Chat Shuru Karein</CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Start a new WhatsApp conversation</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all relative z-50 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleStartChat} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                 <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     type="text" 
                     placeholder="e.g. 919876543210"
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/30 outline-none transition-all font-medium"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Name <span className="text-slate-200">(Optional)</span></label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                     type="text" 
                     placeholder="Customer Ka Naam"
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/30 outline-none transition-all font-medium"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                   />
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                <span>Select Template</span>
                {loadingTemplates && <Loader2 className="w-3 h-3 animate-spin" />}
              </label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {templates.length === 0 && !loadingTemplates && (
                  <div className="p-4 border border-slate-100 border-dashed rounded-2xl text-center text-xs text-slate-300">
                    Aapke MSG91 account mein koi Approved Template nahi mila.
                  </div>
                )}
                {templates.map((t) => (
                  <label key={t.id} className={cn(
                    "flex flex-col p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 border-slate-100",
                    selectedTemplate === t.name ? "border-brand-gold/50 bg-brand-gold/5 ring-1 ring-brand-gold/20 shadow-sm" : "bg-white"
                  )}>
                    <input 
                      type="radio" 
                      name="template" 
                      value={t.name}
                      className="hidden"
                      onChange={() => setSelectedTemplate(t.name)}
                    />
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{t.name}</span>
                       <div className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-500">{t.category}</div>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">{t.content}</p>
                  </label>
                ))}
              </div>
            </div>

            <Button 
               disabled={sending || !phone || !selectedTemplate}
               className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] shadow-xl shadow-slate-900/20 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
            >
               {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
               Send Pehla Message
            </Button>
            
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
              Note: Naye number ko hamesha template hi bhejna padta hai.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
