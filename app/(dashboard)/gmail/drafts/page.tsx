'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileEdit, Trash2, Mail, ArrowRight, Eye, AlertCircle, RefreshCw, Plus, Save
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Draft = {
  id: string;
  campaignName: string;
  subject: string;
  recipientsCount: number;
  updatedAt: string;
};

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/gmail/drafts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.drafts) {
        setDrafts(data.drafts);
      }
    } catch (err) {
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the draft "${name}"? This cannot be undone.`)) return;
    
    setDeleting(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/gmail/drafts?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(p => p.filter(d => d.id !== id));
        toast.success('Draft deleted successfully');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to delete draft');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Draft <span className="text-red-500">Management</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Saved Campaigns • Resume Anytime
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDrafts}
            className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', loading && 'animate-spin')} />
          </button>
          <Link href="/gmail/campaigns/create">
            <Button className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Drafts List */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
          <div className="col-span-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Campaign Name</div>
          <div className="col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Saved On</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipients</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Save className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-400 uppercase tracking-tight">No Drafts Saved</p>
              <p className="text-[10px] text-slate-300 mt-1">
                You can save a campaign as a draft during the final Review step.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {drafts.map(draft => (
              <div key={draft.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors items-center group">
                <div className="col-span-5 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate leading-tight">{draft.campaignName}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 max-w-[80%]">
                    {draft.subject || 'No subject yet'}
                  </p>
                </div>
                
                <div className="col-span-3">
                  <p className="text-[11px] font-bold text-slate-600">
                    {new Date(draft.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[9.5px] text-slate-400">
                    {new Date(draft.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {draft.recipientsCount} Users
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => router.push(`/gmail/campaigns/create?draftId=${draft.id}`)}
                    className="h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                  >
                    <FileEdit className="w-3 h-3" /> Edit
                  </Button>
                  <button
                    onClick={() => handleDelete(draft.id, draft.campaignName)}
                    disabled={deleting === draft.id}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deleting === draft.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-500" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
