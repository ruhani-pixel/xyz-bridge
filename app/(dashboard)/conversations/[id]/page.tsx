'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { MessageBubble } from '@/components/conversations/MessageBubble';
import { Button } from '@/components/ui/Button';
import { MessageCircle, ExternalLink, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { formatPhone } from '@/lib/utils';

export default function ConversationDetailPage() {
  const params = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;

    // Load messages for this conversation
    const q = query(
      collection(db, 'messages'),
      where('chatwootConversationId', '==', Number(params.id)),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
      setLoading(false);
      // Scroll to bottom on new messages
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Find contact by conversation ID (querying contacts since ID is phone number)
    const loadContact = async () => {
      const contactsRef = collection(db, 'contacts');
      const cq = query(contactsRef, where('chatwootConversationId', '==', Number(params.id)));
      const snap = await onSnapshot(cq, (s) => {
        if (!s.empty) setContact(s.docs[0].data());
      });
    };
    loadContact();

    return () => unsubscribeMessages();
  }, [params.id]);

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden glass">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/conversations">
            <Button variant="ghost" size="icon" className="text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h3 className="text-lg font-bold text-white">{contact?.name || 'Loading...'}</h3>
            <p className="text-xs text-slate-500 font-mono">{contact ? formatPhone(contact.phoneNumber) : '...'}</p>
          </div>
        </div>
        
        {contact && (
          <a 
            href={`${process.env.NEXT_PUBLIC_CHATWOOT_URL}/app/accounts/${process.env.NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID}/conversations/${params.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800">
              <ExternalLink className="w-4 h-4" />
              Open in Chatwoot
            </Button>
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500">Loading messages...</div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={scrollRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <MessageCircle className="w-12 h-12 opacity-20" />
            <p>No messages in this thread yet.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-900/30 border-t border-slate-800">
        <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest">
          Replies must be sent through the Chatwoot dashboard
        </p>
      </div>
    </div>
  );
}
