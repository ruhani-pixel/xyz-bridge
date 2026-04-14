'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useMessages } from '@/hooks/useMessages';
import { formatPhone, cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function RecentMessages({ ownerId }: { ownerId: string | undefined }) {
  const { messages, loading } = useMessages(ownerId, 10);

  if (loading && messages.length === 0) {
    return <div className="py-20 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest animate-pulse">Establishing contact sync...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xl p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-100/50">
           <MessageSquare className="w-6 h-6 text-slate-200" />
        </div>
        <div className="space-y-1">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Active Conversations</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Your recent message history will appear here.</p>
        </div>
        <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto leading-relaxed italic">
          Jab aapka pehla customer Website Widget ya WhatsApp par message bhejega, uski details yahan real-time mein dikhne lagengi.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xl">
// ... rest of the table remains same ...
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
         <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Messages</h3>
         <Link href="/messages" className="text-[10px] font-black text-slate-400 hover:text-brand-gold uppercase tracking-widest flex items-center gap-1 transition-colors">
            View All <span className="text-xs">›</span>
         </Link>
      </div>
      <Table>
        <TableHeader className="bg-slate-50/30">
          <TableRow className="border-slate-50 hover:bg-transparent">
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-8 py-4">Contact</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direction</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-8">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((msg) => (
            <TableRow key={msg.id} className="border-slate-50 text-slate-600 hover:bg-slate-50/50 transition-colors">
              <TableCell className="pl-8 py-5">
                <div className="flex items-center gap-3">
                  <Avatar name={msg.contactName || 'U'} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm tracking-tight leading-none mb-1">{msg.contactName}</span>
                    <span className="text-[10px] font-medium text-slate-400">{formatPhone(msg.phoneNumber)}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-[250px] truncate text-[13px] font-medium text-slate-500">
                {msg.content}
              </TableCell>
              <TableCell>
                <div className={cn(
                  "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                  msg.direction === 'inbound' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                )}>
                  {msg.direction === 'inbound' ? '↓ In' : '↑ Out'}
                </div>
              </TableCell>
              <TableCell>
                <div className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  msg.status === 'failed' 
                    ? 'bg-rose-50 text-rose-500 border-rose-100' 
                    : msg.status === 'delivered'
                    ? 'bg-blue-50 text-blue-500 border-blue-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                )}>
                  {msg.status}
                </div>
              </TableCell>
              <TableCell className="pr-8 text-[11px] font-bold text-slate-400">
                {msg.timestamp?.seconds ? formatDistanceToNow(new Date(msg.timestamp.seconds * 1000), { addSuffix: true }) : 'Just now'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
