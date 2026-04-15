'use client';

import { useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Send, AlertCircle, Clock, Plus, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function GmailDashboardPage() {
  const { user, adminData } = useAuth();
  const [hasAppPassword] = useState(false); // Placeholder logic

  // Sample data for the "Premium" look
  const stats = {
    sentToday: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    limit: 500,
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase leading-none">
            Email <span className="text-red-500">Command</span> Center
          </h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100">
                <Zap className="w-3 h-3 fill-current" />
                <span className="text-[9px] font-black uppercase tracking-widest">Gmail Integrated</span>
             </div>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-80">
               Ultra-Fast Mass Mailing Infrastructure
             </p>
          </div>
        </div>
        
        <Link href="/gmail/campaigns/create">
            <Button className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] shadow-2xl shadow-slate-900/20 font-black uppercase text-[11px] tracking-[0.15em] flex items-center gap-3 group transition-all hover:scale-[1.02] active:scale-95">
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-500" />
                Launch New Campaign
            </Button>
        </Link>
      </div>

      {/* Connection Warning / Guide (Only if not connected) */}
      {!hasAppPassword && (
        <div className="relative group overflow-hidden rounded-[3rem] border border-red-100 bg-white p-1">
           <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
           <div className="relative flex flex-col lg:flex-row items-center gap-8 p-10 lg:p-14">
              <div className="w-24 h-24 bg-red-100 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/10">
                 <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Gmail Setup Needed</h2>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">
                   To start sending mass emails, you need to connect your Google Account via an <span className="text-red-500 font-black">App Password</span>. This is a secure 16-character code that allows our platform to send emails on your behalf safely.
                 </p>
              </div>
              <Link href="/gmail/settings">
                 <Button className="h-14 px-10 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 flex items-center gap-3">
                   Configure Now <ArrowRight className="w-4 h-4" />
                 </Button>
              </Link>
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Emails Sent Today" 
          value={stats.sentToday} 
          icon={Send}
          description="Total successful deliveries"
        />
        <StatCard 
          title="Pending Queue" 
          value={stats.pending} 
          icon={Clock}
          description="Emails waiting to be processed"
        />
        <StatCard 
          title="Daily Limit Usage" 
          value={`${stats.sentToday}/${stats.limit}`} 
          icon={Zap}
          description="Google's 24h rolling limit"
        />
        <StatCard 
          title="Failure Rate" 
          value={`${stats.failed}%`} 
          icon={AlertCircle}
          description="Invalid addresses or limits hit"
        />
      </div>

      {/* Recent Activity & Quick Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 relative group overflow-hidden bg-white border border-slate-100 rounded-[3rem] p-12 transition-all hover:border-slate-200">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Campaigns</h3>
              </div>
              <Link href="/gmail/campaigns" className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-2">
                 View All <ArrowRight className="w-3 h-3" />
              </Link>
           </div>

           {/* Empty State Mockup */}
           <div className="py-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                 <Plus className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active campaigns found</p>
              <p className="text-slate-300 text-[9px] uppercase tracking-widest mt-1">Start by clicking "Launch New Campaign" above</p>
           </div>
        </div>

        <div className="flex flex-col gap-8">
           {/* Quick Tutorial Card */}
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                       <ExternalLink className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Pro Tips</span>
                 </div>
                 <h4 className="text-lg font-black uppercase tracking-tight mb-4">Mailing Best Practices</h4>
                 <ul className="space-y-4">
                    {[
                      'Use {{Name}} tags for high inbox delivery',
                      'Keep body text clean and minimal',
                      'Avoid more than 2 links per email',
                      'Stick to 480 emails/day to be safe'
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-[11px] font-medium text-white/70 leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                 </ul>
              </div>
           </div>

           {/* Help Card */}
           <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10 flex flex-col items-center text-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Need Help?</h4>
              <p className="text-[11px] text-slate-500 font-bold mb-6">Our experts are online to help you with SMTP configuration.</p>
              <Button variant="ghost" className="w-full h-12 rounded-2xl border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all">
                Talk to Support
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
