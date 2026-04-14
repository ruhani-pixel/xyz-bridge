import { useWebhookLogs } from '@/hooks/useWebhookLogs';
import { Bot, MessageSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function MessageFlow({ ownerId }: { ownerId: string | undefined }) {
  const { logs, loading } = useWebhookLogs(ownerId, 6);

  if (loading && logs.length === 0) {
    return <div className="py-10 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest animate-pulse">Scanning live traffic...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="py-10 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100/50">
           <MessageSquare className="w-5 h-5 text-slate-200" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity detected yet.</p>
        <p className="text-[9px] text-slate-300 font-medium px-4 leading-relaxed">System is ready. Use the Website Widget or WhatsApp to trigger a live sync.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="group relative pl-6 pb-6 last:pb-0 border-l border-slate-100">
           {/* Timeline Bullet */}
           <div className={cn(
             "absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full ring-4 ring-white transition-all",
             log.event.includes('AI') ? "bg-brand-gold shadow-[0_0_8px_#C5A059]" : "bg-slate-300"
           )} />

           <div className="flex flex-col gap-1.5 translate-y-[-4px]">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    {log.event.includes('AI') ? (
                      <Bot className="w-3.5 h-3.5 text-brand-gold" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{log.event.replace(/_/g, ' ')}</span>
                 </div>
                 <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                   {log.timestamp?.seconds ? formatDistanceToNow(new Date(log.timestamp.seconds * 1000), { addSuffix: true }) : 'Now'}
                 </span>
              </div>
              
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                 <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic line-clamp-2">
                   {log.details}
                 </p>
                 <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{log.source} Node</span>
                 </div>
              </div>
           </div>
        </div>
      ))}
    </div>
  );
}
