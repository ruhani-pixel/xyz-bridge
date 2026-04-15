'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Mail, Send, AlertCircle, CheckCircle2, Clock, Plus, Search, Filter,
  ArrowRight, BarChart2, Trash2, Eye, RefreshCw, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'active' | 'processing' | 'completed' | 'failed';
  createdAt: string;
};

type Stats = {
  totalSent: number;
  totalFailed: number;
  totalRecipients: number;
  totalCampaigns: number;
};

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400 animate-pulse', icon: Clock },
  active: { label: 'Active', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse', icon: Send },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', icon: AlertCircle },
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSent: 0, totalFailed: 0, totalRecipients: 0, totalCampaigns: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/gmail/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
        setStats(data.stats || { totalSent: 0, totalFailed: 0, totalRecipients: 0, totalCampaigns: 0 });
      }
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const deliveryRate = stats.totalRecipients > 0
    ? Math.round((stats.totalSent / stats.totalRecipients) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Campaign <span className="text-red-500">History</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            All campaigns • Cumulative data • Never resets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaigns}
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: stats.totalCampaigns, icon: BarChart2, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Emails Delivered', value: stats.totalSent.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Failed / Bounced', value: stats.totalFailed.toLocaleString(), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: Send, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn('bg-white border rounded-2xl p-5 flex items-center gap-4', border)}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div className="min-w-0">
              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'completed', 'processing', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={cn(
                'px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                filterStatus === f
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
          <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Campaign</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sent / Total</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Failed</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading campaigns...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-400 uppercase tracking-tight">No campaigns found</p>
              <p className="text-[10px] text-slate-300 mt-1">
                {search || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Launch your first campaign above'}
              </p>
            </div>
            {!search && filterStatus === 'all' && (
              <Link href="/gmail/campaigns/create">
                <Button className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 mt-2">
                  <Plus className="w-3.5 h-3.5" /> Create First Campaign
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(campaign => {
              const sc = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.completed;
              const StatusIcon = sc.icon;
              const rate = campaign.totalRecipients > 0
                ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
                : 0;
              return (
                <div key={campaign.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors items-center group">
                  {/* Campaign Info */}
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate leading-tight">{campaign.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{campaign.subject}</p>
                    {/* Delivery bar */}
                    <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                  {/* Status */}
                  <div className="col-span-2">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest border', sc.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                      {sc.label}
                    </span>
                  </div>
                  {/* Sent Count */}
                  <div className="col-span-2">
                    <p className="text-sm font-black text-slate-900">{campaign.sentCount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">of {campaign.totalRecipients.toLocaleString()}</p>
                  </div>
                  {/* Failed */}
                  <div className="col-span-2">
                    <p className={cn('text-sm font-black', campaign.failedCount > 0 ? 'text-red-500' : 'text-slate-300')}>
                      {campaign.failedCount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400">{rate}% delivered</p>
                  </div>
                  {/* Date */}
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-slate-600">
                      {new Date(campaign.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[9.5px] text-slate-400">
                      {new Date(campaign.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest">
        Campaign data is stored permanently in your account • Cumulative stats never decrease
      </p>
    </div>
  );
}
