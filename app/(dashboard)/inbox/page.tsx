'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useContacts } from '@/hooks/useContacts';
import { InboxSidebar } from '@/components/inbox/InboxSidebar';
import { ChatWindow } from '@/components/inbox/ChatWindow';
import { ContactDetail } from '@/components/inbox/ContactDetail';
import { Contact } from '@/types/contact';
import { Loader2, MessageSquare } from 'lucide-react';

export default function InboxPage() {
  const { user } = useAuth();
  const { contacts, loading } = useContacts(user?.uid);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const activeContact = selectedId ? contacts.find(c => c.id === selectedId) : undefined;

  if (loading && contacts.length === 0) {
// ... loading block ...
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Contacts Sidebar */}
      <div className="w-80 flex-shrink-0">
        <InboxSidebar 
          contacts={contacts} 
          selectedId={selectedId} 
          onSelect={(c) => setSelectedId(c.id)} 
        />
      </div>

      {/* 2. Main Chat Window */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeContact ? (
          <div className="flex-1 flex gap-6 min-h-0">
            <div className="flex-1 min-w-0">
              <ChatWindow contact={activeContact} />
            </div>
            
            {/* 3. Contact Detail Sidebar (Right) */}
            <div className="w-72 flex-shrink-0 hidden xl:block">
              <ContactDetail contact={activeContact} />
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white border border-slate-200/60 rounded-[2rem] shadow-sm flex flex-col items-center justify-center p-12 text-center decoration-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select a conversation</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-2 font-medium">
              Choose a contact from the left list to start messaging or manage AI auto-replies.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
