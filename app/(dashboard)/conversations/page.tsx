'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ConversationCard } from '@/components/conversations/ConversationCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Search, Filter, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportButton } from '@/components/ui/ExportButton';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'contacts'),
      where('status', '==', filter),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const filteredConversations = conversations.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phoneNumber?.includes(search)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header with Breadcrumb-like style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
           <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-2">Conversations</h1>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-80 pl-1">WhatsApp Bridge Admin Panel</p>
        </div>
        <ExportButton data={conversations} filename="conversations_list" />
      </div>

      {/* Control Bar: Search + Filter Pills */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto">
          {['all', 'active', 'resolved', 'blocked'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Encrypted Data...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {filteredConversations.map((conv) => (
              <ConversationCard key={conv.id} contact={conv} />
            ))}
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                <Filter className="w-6 h-6 text-slate-200" />
             </div>
             <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">No results found</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Try adjusting your filters or search query</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
