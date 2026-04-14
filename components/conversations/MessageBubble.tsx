import { cn } from '@/lib/utils';
import { Message } from '@/types/message';
import { format } from 'date-fns';

export function MessageBubble({ message }: { message: Message }) {
  const isInbound = message.direction === 'inbound';
  
  const timestamp = message.timestamp?.seconds 
    ? format(new Date(message.timestamp.seconds * 1000), 'p') 
    : '...';

  return (
    <div className={cn("flex w-full mb-4", isInbound ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[70%] p-3 rounded-2xl shadow-sm relative group",
        isInbound 
          ? "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700" 
          : "bg-whatsapp-teal text-white rounded-tr-none"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={cn(
          "text-[10px] mt-1 flex items-center justify-end gap-1 opacity-60",
          isInbound ? "text-slate-400" : "text-white"
        )}>
          {timestamp}
          {!isInbound && (
            <span className="text-[8px]">
              {message.status === 'delivered' ? '✓✓' : message.status === 'sent' ? '✓' : '!'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
