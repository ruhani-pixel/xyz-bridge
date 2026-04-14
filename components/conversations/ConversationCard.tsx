import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Contact } from '@/types/conversation';
import { formatPhone, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { ChevronRight } from 'lucide-react';

export function ConversationCard({ contact }: { contact: Contact }) {
  const isBlocked = contact.status === 'blocked';
  
  return (
    <Link href={`/conversations/${contact.chatwootConversationId}`}>
      <div className="flex items-center gap-6 p-6 hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden">
        {/* Active Line Indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Avatar Section */}
        <Avatar name={contact.name || 'U'} size="lg" className="flex-shrink-0" />

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-emerald-600 transition-colors uppercase">{contact.name}</h4>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {contact.lastMessageAt?.seconds 
                ? formatDistanceToNow(new Date(contact.lastMessageAt.seconds * 1000), { addSuffix: true }) 
                : 'Just now'
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
             <p className="text-[13px] font-medium text-slate-500 truncate italic max-w-sm">
               {isBlocked ? <span className="text-rose-500 font-bold uppercase not-italic">Account Blocked</span> : `You: ${contact.lastMessage || 'Bridge connected.'}`}
             </p>
             <span className="text-[10px] text-slate-300 font-bold">•</span>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{formatPhone(contact.phoneNumber)}</p>
          </div>
        </div>

        {/* Meta Section */}
        <div className="flex items-center gap-4">
           {/* Filters / Status Pills */}
           <div className={cn(
             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
             isBlocked ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
           )}>
             {contact.status}
           </div>

           {/* Message Count Badge */}
           <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200">
             21 msgs
           </div>

           <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}
