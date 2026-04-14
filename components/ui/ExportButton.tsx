'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileJson, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename: string;
  className?: string;
  variant?: 'outline' | 'solid';
}

export function ExportButton({ data, filename, className, variant = 'outline' }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const exportCSV = () => {
    if (!data || !data.length) return toast.error('No data to export');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${String(val).replace(/"/g, '""')}"`
      ).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    setOpen(false);
    toast.success('Excel/CSV Exported Successfully');
  };

  const exportJSON = () => {
    if (!data || !data.length) return toast.error('No data to export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
    setOpen(false);
    toast.success('JSON Source Exported');
  };

  const exportPDF = () => {
    setOpen(false);
    toast.success('Readying PDF Layout...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="relative z-[60]" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden group",
          variant === 'outline' 
            ? "bg-white border-2 border-slate-200 text-slate-700 hover:border-brand-gold hover:text-brand-gold" 
            : "bg-brand-gold text-white shadow-xl shadow-brand-gold/20 hover:bg-brand-gold/90",
          className
        )}
      >
        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
        Export Data
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-100 rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] overflow-hidden py-3 animate-in fade-in zoom-in-95 origin-top-right duration-200">
           <div className="px-4 pb-2 mb-2 border-b border-slate-50">
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Download As</span>
           </div>
           
           <button onClick={exportCSV} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 text-left text-xs font-bold text-slate-700 uppercase tracking-wider transition-colors group">
             <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <FileSpreadsheet className="w-4 h-4" />
             </div>
             Excel (.csv)
           </button>
           
           <button onClick={exportPDF} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 text-left text-xs font-bold text-slate-700 uppercase tracking-wider transition-colors group">
             <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Printer className="w-4 h-4" />
             </div>
             PDF (Print View)
           </button>
           
           <button onClick={exportJSON} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 text-left text-xs font-bold text-slate-700 uppercase tracking-wider transition-colors group">
             <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
               <FileJson className="w-4 h-4" />
             </div>
             Source (.json)
           </button>
        </div>
      )}
    </div>
  );
}
