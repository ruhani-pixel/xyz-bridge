'use client';

import { useState } from 'react';
import { Contact } from '@/types/contact';
import { Search, Filter, Bot, MessageSquare, ShieldCheck, Globe } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatPhone } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { StartChatModal } from './StartChatModal';

interface InboxSidebarProps {
  contacts: Contact[];
  selectedId: string | null | undefined;
  onSelect: (contact: Contact) => void;
}

export function InboxSidebar({ contacts, selectedId, onSelect }: InboxSidebarProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai_on'>('all');
  const [channel, setChannel] = useState<'whatsapp' | 'website'>('whatsapp');

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { adminData } = useAuth();
  const currentCount = adminData?.messageCount || 0;
  const messageLimit = adminData?.messageLimit || 100;
  const usagePercent = Math.min((currentCount / messageLimit) * 100, 100);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ phoneNumber: newPhone, name: newName })
      });
      const data = await res.json();
      if (data.success) {
        onSelect(data.contact);
        setNewPhone('');
        setNewName('');
        setIsNewChatOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const searchLow = search.toLowerCase();
    const nameMatch = c.name ? c.name.toLowerCase().includes(searchLow) : false;
    const phoneMatch = c.phoneNumber ? c.phoneNumber.includes(search) : false;
    const matchesSearch = nameMatch || phoneMatch;
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? c.unreadCount > 0 :
      filter === 'ai_on' ? c.aiEnabled : true;
    
    const matchesChannel = 
      channel === 'whatsapp' ? c.source !== 'widget' :
      channel === 'website' ? c.source === 'widget' : true;
    
    return matchesSearch && matchesFilter && matchesChannel;
  });

  const whatsappUnread = contacts.filter(c => c.source !== 'widget' && c.unreadCount > 0).length;
  const websiteUnread = contacts.filter(c => c.source === 'widget' && c.unreadCount > 0).length;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* New Conversation Button */}
      <button 
        onClick={() => setIsNewChatOpen(true)}
        className="w-full p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] group"
      >
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <MessageSquare className="w-4 h-4 text-brand-gold" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">New message</span>
      </button>

      {/* Channel Switcher */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
        <button
          onClick={() => setChannel('whatsapp')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative",
            channel === 'whatsapp' 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <MessageSquare className={cn("w-3.5 h-3.5", channel === 'whatsapp' ? "text-brand-gold" : "text-slate-300")} />
          WhatsApp
          {whatsappUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-black border-2 border-white shadow-sm animate-bounce">
              {whatsappUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setChannel('website')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative",
            channel === 'website' 
              ? "bg-white text-slate-900 shadow-sm" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Globe className={cn("w-3.5 h-3.5", channel === 'website' ? "text-brand-gold" : "text-slate-300")} />
          Website
          {websiteUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-gold text-white text-[8px] font-black border-2 border-white shadow-sm animate-bounce">
              {websiteUnread}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200/60 rounded-[2rem] shadow-sm flex flex-col overflow-hidden">
        {/* Header & Search */}
        <div className="p-6 pb-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Chats</h2>
            <div className="flex gap-2">
               <button onClick={() => setFilter('all')} className={cn("p-1.5 rounded-lg transition-all", filter === 'all' ? "bg-brand-gold/10 text-brand-gold" : "text-slate-200 hover:text-slate-400")}><MessageSquare className="w-4 h-4" /></button>
               <button onClick={() => setFilter('ai_on')} className={cn("p-1.5 rounded-lg transition-all", filter === 'ai_on' ? "bg-brand-gold/10 text-brand-gold" : "text-slate-200 hover:text-slate-400")}><Bot className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 h-10 bg-slate-50 border-slate-100 rounded-xl text-xs font-medium focus:ring-brand-gold/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact) => (
              <motion.button
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={contact.id}
                onClick={() => onSelect(contact)}
                className={cn(
                  "w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group selection:bg-transparent",
                  selectedId === contact.id 
                    ? "bg-slate-50 border border-slate-100 shadow-sm" 
                    : "hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={contact.name} size="md" />
                  {contact.aiEnabled && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-gold rounded-full border-2 border-white flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "font-black text-xs tracking-tight truncate",
                        selectedId === contact.id ? "text-slate-900" : "text-slate-700"
                      )}>
                        {contact.name || formatPhone(contact.phoneNumber)}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                        contact.source === 'widget' 
                          ? "bg-brand-gold/10 text-brand-gold" 
                          : contact.phoneNumber === '910000000000'
                          ? "bg-blue-50 text-blue-600"
                          : "bg-emerald-50 text-emerald-600"
                      )}>
                        {contact.source === 'widget' ? 'WEB' : contact.phoneNumber === '910000000000' ? 'BRIDGE' : 'WA'}
                      </span>
                    </div>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter shrink-0 ml-2">
                      {contact.lastMessageAt?.seconds ? formatDistanceToNow(new Date(contact.lastMessageAt.seconds * 1000), { addSuffix: false }) : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <p className={cn(
                       "text-[10px] font-medium truncate",
                       selectedId === contact.id ? "text-slate-600" : "text-slate-400"
                     )}>
                       {contact.lastMessage || 'No messages yet'}
                     </p>
                     {contact.unreadCount > 0 && (
                       <span className="px-1.5 py-0.5 bg-brand-gold text-white text-[8px] font-black rounded-md flex items-center justify-center">
                         {contact.unreadCount} NEW
                       </span>
                     )}
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {filteredContacts.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center">
               <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-slate-200" />
               </div>
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed px-10">No active conversations found</p>
            </div>
          )}
        </div>

        {/* Quota Widget (Bottom of Sidebar) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Plan Usage</span>
                 </div>
                 <span className="text-[10px] font-black text-brand-gold">{currentCount}/{messageLimit}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                 <div 
                   className="h-full bg-brand-gold transition-all duration-1000"
                   style={{ width: `${usagePercent}%` }}
                 />
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {adminData?.planId === 'free_trial' ? 'Free Trial: 15 Days Active' : 'Starter Plan Active'}
              </p>
           </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <StartChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
      />
    </div>
  );
}
