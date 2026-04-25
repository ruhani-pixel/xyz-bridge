'use client';

import { Contact } from '@/types/contact';
import { 
  User, 
  Phone, 
  Calendar, 
  MessageCircle, 
  Bot, 
  Trash2, 
  Slash,
  Clock,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn, formatPhone } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactDetailProps {
  contact: Contact;
}

export function ContactDetail({ contact }: ContactDetailProps) {
  const { adminData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const aiEnabled = contact.aiEnabled;
  const bridgeEnabled = contact.bridgeEnabled || false;

  const isMsg91Setup = !!adminData?.msg91_authkey && !!adminData?.msg91_integrated_number;
  const isChatwootSetup = !!adminData?.chatwoot_api_token && !!adminData?.chatwoot_account_id && !!adminData?.chatwoot_inbox_id;

  const toggleAI = async () => {
    if (!isMsg91Setup) {
      toast.error('Kripya pehle Settings mein MSG91 setup karein!', {
        description: 'AI replies ke liye MSG91 integrated number hona zaroori hai.'
      });
      return;
    }

    setLoading(true);
    const newState = !aiEnabled;
    try {
      const res = await fetch(`/api/contacts/${contact.id}/ai-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to toggle');
      }
      toast.success(`Platform Mode: ${newState ? 'AI Replies ON ⚡' : 'OFF'}`);
    } catch (error: any) {
       toast.error(error.message || 'AI toggle karne mein error aaya.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBridge = async () => {
    if (!isChatwootSetup) {
      toast.error('Kripya pehle Settings mein Chatwoot setup karein!', {
        description: 'Bridge mode ke liye Chatwoot credentials hona zaroori hai.'
      });
      return;
    }

    setLoading(true);
    const newState = !bridgeEnabled;
    try {
      const res = await fetch(`/api/contacts/${contact.id}/bridge-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });

      if (!res.ok) throw new Error('Failed to toggle');
      toast.success(`Bridge Mode: ${newState ? 'Forwarding to Chatwoot' : 'Local Only'}`);
    } catch (error) {
       toast.error('Bridge toggle karne mein samasya aayi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/messages`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Chat history saaf ho gayi hai!');
      setShowClearModal(false);
    } catch {
      toast.error('Chat clear nahi ho payi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Contact aur chat dono dilit ho gaye!');
      setShowDeleteModal(false);
      window.location.reload(); // Refresh to update list
    } catch {
      toast.error('Dilit karne mein error aaya.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Messages', value: contact.totalMessages || 0, icon: MessageCircle },
    { label: 'Last Activity', value: contact.lastMessageAt?.seconds ? new Date(contact.lastMessageAt.seconds * 1000).toLocaleDateString() : 'N/A', icon: Clock },
  ];

  return (
    <div className="h-full bg-white border border-slate-200/60 rounded-[2rem] shadow-sm flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Profile Section */}
      <div className="p-8 text-center border-b border-slate-50">
        <div className="flex justify-center mb-6 relative">
           <Avatar name={contact.name} size="lg" />
           <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
          {contact.name || 'Unknown Contact'}
        </h3>
        <p className="text-xs font-black text-brand-gold uppercase tracking-[0.2em] mb-4 text-center">
          Verified Agent Link
        </p>
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 rounded-xl max-w-[200px] mx-auto overflow-hidden">
           <Phone className="w-3 h-3 text-slate-400 shrink-0" />
           <span className="text-[10px] font-bold text-slate-600 truncate">{formatPhone(contact.phoneNumber)}</span>
        </div>
      </div>

      {/* AI & Automation Controls */}
      <div className="p-8 space-y-6">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Automation Hub</h4>
          <div className="p-5 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-5">
             
             {/* AI Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-brand-gold/10 rounded-xl flex items-center justify-center border border-brand-gold/20">
                      <Bot className="w-4 h-4 text-brand-gold" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Platform Mode</span>
                      <span className={cn("text-[8px] font-black uppercase tracking-widest", aiEnabled ? "text-emerald-500":"text-slate-600")}>
                        {aiEnabled ? 'AI Inbox Active' : 'AI Response Off'}
                      </span>
                   </div>
                </div>
                <button 
                  onClick={toggleAI}
                  disabled={loading}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-300",
                    aiEnabled ? "bg-brand-gold" : "bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    aiEnabled ? "left-6" : "left-1"
                  )} />
                </button>
             </div>

             <div className="h-px bg-slate-900 w-full" />

             {/* Bridge Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Bridge Mode</span>
                      <span className={cn("text-[8px] font-black uppercase tracking-widest", bridgeEnabled ? "text-blue-500":"text-slate-600")}>
                        {bridgeEnabled ? 'Chatwoot Link' : 'SaaS Internal'}
                      </span>
                   </div>
                </div>
                <button 
                  onClick={toggleBridge}
                  disabled={loading}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-300",
                    bridgeEnabled ? "bg-blue-600" : "bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    bridgeEnabled ? "left-6" : "left-1"
                  )} />
                </button>
             </div>

             <p className="text-[9px] text-slate-500 font-bold leading-relaxed italic opacity-60 text-center">
               {bridgeEnabled 
                 ? "Forwarding to Chatwoot workspace." 
                 : "Using internal AI chat dashboard."}
             </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
               <div className="flex items-center gap-3">
                  <stat.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
               </div>
               <span className="text-xs font-black text-slate-900">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Action List */}
        <div className="pt-4 space-y-2">
           <Button 
             variant="ghost" 
             onClick={() => setShowClearModal(true)}
             className="w-full justify-start text-[10px] font-black uppercase tracking-widest text-slate-500 gap-3 py-6 rounded-2xl hover:bg-slate-50 hover:text-slate-900"
           >
             <RotateCcw className="w-4 h-4" /> Clear Chat History
           </Button>
           <Button 
             variant="ghost" 
             onClick={() => setShowDeleteModal(true)}
             className="w-full justify-start text-[10px] font-black uppercase tracking-widest text-rose-500 gap-3 py-6 rounded-2xl hover:bg-rose-50 hover:text-rose-600"
           >
             <Trash2 className="w-4 h-4" /> Delete Entire Contact
           </Button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <Modal 
        isOpen={showClearModal} 
        onClose={() => setShowClearModal(false)}
        title="Clear Chat History?"
      >
        <div className="space-y-4">
           <p className="text-sm text-slate-400 font-medium">Kya aap sach mein is chat ke saare messages hatana chahte hain? Contact list mein rahega par history saaf ho jayegi.</p>
           <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowClearModal(false)} className="flex-1">Nahi, Cancel</Button>
              <Button variant="outline" onClick={handleClearChat} disabled={loading} className="flex-1 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white">Haan, Clear Kar do</Button>
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        title="Dilit Contact?"
      >
        <div className="space-y-4">
           <p className="text-sm text-slate-400 font-medium">⚠️ Dhyaan dein: Ye contact aur iski puri chat hamesha ke liye dilit ho jayegi. Ise wapis nahi laya ja sakta.</p>
           <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">Nahi, Cancel</Button>
              <Button onClick={handleDeleteContact} disabled={loading} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white">Haan, Dilit Karein</Button>
           </div>
        </div>
      </Modal>

      {/* Security Badge */}
      <div className="mt-auto p-8 pt-0 opacity-10 text-center">
         <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-400" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Security Encrypted</p>
         </div>
      </div>

    </div>
  );
}
