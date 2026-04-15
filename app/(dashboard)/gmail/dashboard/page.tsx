'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Mail, Send, AlertCircle, Clock, Plus, Zap, ArrowRight,
  CheckCircle2, BarChart2, RefreshCw, Settings, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

type Stats = {
  totalSent: number;
  totalFailed: number;
  totalRecipients: number;
  totalCampaigns: number;
};

type Campaign = {
  id: string;
  name: string;
  subject: string;
  sentCount: number;
  totalRecipients: number;
  failedCount: number;
  status: string;
  createdAt: string;
};

export default function GmailDashboardPage() {
  const { user, adminData } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalSent: 0, totalFailed: 0, totalRecipients: 0, totalCampaigns: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [hasConfig, setHasConfig] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        // Fetch settings to check if Gmail is configured
        const [settingsRes, campaignsRes] = await Promise.all([
          fetch('/api/user/settings', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/gmail/campaigns', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const settingsData = await settingsRes.json();
        const campaignsData = await campaignsRes.json();

        if (settingsData.config?.gmail_email && settingsData.config?.gmail_app_password) {
          setHasConfig(true);
        }
        if (campaignsData.campaigns) {
          setRecentCampaigns(campaignsData.campaigns.slice(0, 5));
          setStats(campaignsData.stats || { totalSent: 0, totalFailed: 0, totalRecipients: 0, totalCampaigns: 0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const deliveryRate = stats.totalRecipients > 0
    ? Math.round((stats.totalSent / stats.totalRecipients) * 100)
    : 0;

  const STAT_CARDS = [
    {
      label: 'Total Sent',
      value: stats.totalSent.toLocaleString(),
      sub: 'All time deliveries',
      icon: Send,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Campaigns Run',
      value: stats.totalCampaigns,
      sub: 'Cumulative, never resets',
      icon: BarChart2,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      label: 'Delivery Rate',
      value: `${deliveryRate}%`,
      sub: `${stats.totalRecipients.toLocaleString()} total targeted`,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Failed / Bounced',
      value: stats.totalFailed.toLocaleString(),
      sub: 'Invalid or limit-hit',
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">
            Email <span className="text-red-500">Command</span> Center
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8.5px] font-black uppercase tracking-widest',
              hasConfig
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            )}>
              <div className={cn('w-1.5 h-1.5 rounded-full', hasConfig ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
              {hasConfig ? 'SMTP Connected' : 'Setup Required'}
            </div>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">
              Gmail Mass Mailing • Spark Plan
            </p>
          </div>
        </div>
        <Link href="/gmail/campaigns/create">
          <Button className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg font-black uppercase text-[9.5px] tracking-widest flex items-center gap-2 group transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-300" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* ── Setup Warning Banner ── */}
      {!hasConfig && !loading && (
        <div className="relative overflow-hidden bg-white border border-red-200 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center gap-5 p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-0.5">Gmail Setup Required</h2>
              <p className="text-[12px] text-slate-500 font-medium max-w-lg">
                Connect your Google Account with an <span className="text-red-500 font-black">App Password</span> to start sending mass emails. Takes less than 2 minutes.
              </p>
            </div>
            <Link href="/gmail/settings">
              <Button className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm flex items-center gap-2 flex-shrink-0">
                Configure Now <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn('bg-white border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow', border)}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-4.5 h-4.5', color)} />
            </div>
            <div>
              <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-0.5">{loading ? '—' : value}</p>
              <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom two-column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Campaigns Table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Campaigns</h3>
            </div>
            <Link href="/gmail/campaigns" className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1.5">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <RefreshCw className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                No campaigns yet. Launch one to see data here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentCampaigns.map(c => {
                const rate = c.totalRecipients > 0 ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;
                return (
                  <div key={c.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.subject}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-slate-800">{c.sentCount}<span className="text-slate-400 font-medium">/{c.totalRecipients}</span></p>
                        <p className="text-[9px] text-slate-400">{rate}% sent</p>
                      </div>
                      <div className={cn(
                        'text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest',
                        c.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                        'bg-red-50 text-red-700'
                      )}>
                        {c.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Links + Tips */}
        <div className="space-y-4">
          {/* Quick Links */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h4>
            <div className="space-y-2">
              {[
                { href: '/gmail/campaigns/create', icon: Send, label: 'New Campaign', color: 'text-red-500 bg-red-50' },
                { href: '/gmail/templates', icon: FileText, label: 'Email Templates', color: 'text-violet-500 bg-violet-50' },
                { href: '/gmail/campaigns', icon: BarChart2, label: 'Campaign History', color: 'text-blue-500 bg-blue-50' },
                { href: '/gmail/settings', icon: Settings, label: 'SMTP Settings', color: 'text-slate-500 bg-slate-50' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-red-400 fill-red-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Pro Tips</span>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-3">Mailing Best Practices</h4>
              <ul className="space-y-2.5">
                {[
                  'Use {{Name}} for personalization',
                  'Keep subject line under 50 chars',
                  'Max 2 links per email body',
                  'Send max 480/day to stay safe',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10.5px] text-white/60 font-medium leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
