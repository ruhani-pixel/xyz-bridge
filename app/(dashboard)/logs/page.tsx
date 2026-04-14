'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { Terminal, Database, MessageSquare, AlertCircle, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ExportButton } from '@/components/ui/ExportButton';

import { motion, AnimatePresence } from 'framer-motion';

export default function LogsPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'whatsapp' | 'website'>('all');

  useEffect(() => {
    // Show popup after a short delay
    const timer = setTimeout(() => setShowPopup(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16 animate-in fade-in duration-700 relative">
      
      {/* 2026 Premium "Feature Coming Soon" Overlay */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden text-center"
             >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
                
                <div className="relative z-10 space-y-6">
                   <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-900/40 animate-bounce">
                      <Terminal className="w-10 h-10 text-brand-gold" />
                   </div>
                   
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Feature Coming Soon!</h3>
                      <p className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.2em]">Alpha Sync Phase 2</p>
                   </div>
                   
                   <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                      Internal Logs system par kaam chal raha hai. Jald hi aap har live request aur AI decision ko yahan track kar payenge.
                   </p>
                   
                   <Button 
                     onClick={() => setShowPopup(false)}
                     className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                   >
                     Samajh Gaya (Close)
                   </Button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-2">Internal Logs</h1>
          <div className="flex items-center gap-3">
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-80 pl-1">Live Synchronization Events</p>
             <div className="h-4 w-[1.5px] bg-slate-200" />
             {/* Source Switcher */}
             <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm gap-1">
                {(['all', 'whatsapp', 'website'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      sourceFilter === s ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Scanning Webhook Nodes</span>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-2xl rounded-[3rem] overflow-hidden min-h-[500px] flex items-center justify-center relative group">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none" />

        <CardContent className="relative z-10 flex flex-col items-center text-center p-12">
            <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-slate-900/40 relative animate-[bounce_4s_ease-in-out_infinite]">
               <Database className="w-10 h-10 text-brand-gold" />
               <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-gold rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
               </div>
            </div>

            <div className="space-y-4 max-w-sm">
               <div className="inline-flex items-center px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full mb-2">
                  <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Protocol Alpha ● Coming Soon</span>
               </div>
               
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Advanced Monitoring
               </h2>
               
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Humare ultra-advanced logging system par kaam chal raha hai. Jald hi aap har AI decision aur Delivery event ko track kar payenge.
               </p>
            </div>

            <div className="mt-12 flex gap-4">
               <div className="px-6 py-3 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">End-to-End Encrypted Logs</span>
               </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
