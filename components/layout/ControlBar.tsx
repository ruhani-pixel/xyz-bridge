'use client';

import { Search, Download, Trash2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ControlBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
  onStop?: () => void;
  onClear?: () => void;
  filters?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function ControlBar({ 
  searchTerm, 
  onSearchChange, 
  onExport, 
  onStop, 
  onClear,
  filters, 
  placeholder = "Search...", 
  className 
}: ControlBarProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm", className)}>
      {/* Search Section */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 focus:border-brand-gold/30 transition-all font-medium"
        />
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
        {filters}
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-4 w-full md:w-auto justify-end">
        {onStop && (
           <Button variant="ghost" size="sm" onClick={onStop} className="text-red-500 hover:bg-red-50 gap-2 h-10 px-4 rounded-xl">
             <StopCircle className="w-4 h-4" />
             <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">Stop Logs</span>
           </Button>
        )}
        {onExport && (
           <Button variant="ghost" size="sm" onClick={onExport} className="text-slate-600 hover:bg-slate-100 gap-2 h-10 px-4 rounded-xl">
             <Download className="w-4 h-4" />
             <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">Export</span>
           </Button>
        )}
        {onClear && (
           <Button variant="ghost" size="sm" onClick={onClear} className="text-slate-400 hover:bg-slate-100 h-10 w-10 p-0 rounded-xl">
             <Trash2 className="w-4 h-4" />
           </Button>
        )}
      </div>
    </div>
  );
}
