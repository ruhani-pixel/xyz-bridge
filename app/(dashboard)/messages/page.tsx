'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useMessages } from '@/hooks/useMessages';
import { formatPhone } from '@/lib/utils';
import { format } from 'date-fns';
import { Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function MessagesLogPage() {
  const { user } = useAuth();
  const { messages, loading } = useMessages(user?.uid, 100);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = messages.filter(m => 
    m.phoneNumber.includes(searchTerm) || 
    m.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Name', 'Phone', 'Direction', 'Content', 'Status'];
    const rows = filtered.map(m => [
      m.timestamp?.seconds ? new Date(m.timestamp.seconds * 1000).toISOString() : '',
      m.contactName,
      m.phoneNumber,
      m.direction,
      m.content.replace(/,/g, ' '),
      m.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `messages_export_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-2">Message Registry</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-80 pl-1">Comprehensive Bridge Activity Audit</p>
        </div>
        <Button 
          onClick={exportToCSV} 
          variant="brand" 
          className="gap-2 h-11 px-8 rounded-2xl shadow-xl shadow-brand-gold/20 font-black uppercase text-xs tracking-widest"
        >
          <Download className="w-4 h-4" />
          Export Intelligence
        </Button>
      </div>

      <div className="space-y-6">
        {/* Search Toolbar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-gold transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Audit by name, identifier, or content payload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-gold/30 focus:ring-4 focus:ring-brand-gold/5 transition-all shadow-sm"
          />
        </div>

        <Card className="bg-white border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="p-0 border-b border-slate-50 bg-slate-50/50">
             <div className="flex items-center justify-between px-8 py-5">
                <div className="text-slate-900 text-xs font-black uppercase tracking-widest">Global Protocol History</div>
                <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{filtered.length} Entries matching</div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-50 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-[10px] font-black uppercase tracking-widest pl-10 py-5">Temporal Mark</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Subscriber Identity</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Flow Vector</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Content Payload</TableHead>
                  <TableHead className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-right pr-10">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">Syncing registry nodes...</TableCell></TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map((msg) => (
                    <TableRow key={msg.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="pl-10 py-6 font-mono text-[10px] text-slate-400 font-bold uppercase">
                        {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), 'yyyy/MM/dd HH:mm:ss') : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar name={msg.contactName || msg.phoneNumber} className="w-10 h-10 ring-2 ring-slate-50 group-hover:ring-brand-gold/20 transition-all" />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-slate-900 text-sm tracking-tight uppercase">{msg.contactName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatPhone(msg.phoneNumber)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                          msg.direction === 'inbound' 
                            ? 'bg-blue-50 text-blue-600 border-blue-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        )}>
                          {msg.direction}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                         <p className="text-slate-500 text-[11px] font-medium leading-relaxed line-clamp-2 uppercase tracking-wide group-hover:text-slate-900 transition-colors">
                           {msg.content}
                         </p>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          msg.status === 'failed' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        )}>
                          {msg.status}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center py-24">
                        <div className="space-y-3">
                           <Search className="w-10 h-10 text-slate-200 mx-auto" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching registry entries</p>
                        </div>
                     </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
