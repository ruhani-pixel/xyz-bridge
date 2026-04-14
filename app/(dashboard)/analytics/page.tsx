'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDailyTrend } from '@/hooks/useDailyTrend';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ExportButton } from '@/components/ui/ExportButton';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<'all' | 'whatsapp' | 'website'>('all');
  const { totalStats } = useDashboardStats(user?.uid);
  const { data: trendData, loading: trendLoading } = useDailyTrend(user?.uid, 7);

  const getFilteredStats = () => {
    if (channel === 'whatsapp') return { in: totalStats.whatsappInbound || 0, out: totalStats.whatsappOutbound || 0, fail: totalStats.failedMessages || 0 };
    if (channel === 'website') return { in: totalStats.widgetInbound || 0, out: totalStats.widgetOutbound || 0, fail: 0 };
    return { in: totalStats.totalInbound || 0, out: totalStats.totalOutbound || 0, fail: totalStats.failedMessages || 0 };
  };

  const currentStats = getFilteredStats();

  const distributionData = [
    { name: 'Delivered', value: (currentStats.in + currentStats.out) - (currentStats.fail || 0) },
    { name: 'Failed', value: currentStats.fail || 0 },
  ];

  const DIST_COLORS = ['#10b981', '#ef4444'];

  const successRate = currentStats.in + currentStats.out > 0
    ? (((currentStats.in + currentStats.out) - (currentStats.fail || 0)) / (currentStats.in + currentStats.out) * 100).toFixed(1)
    : '100';

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Analytics</h1>
           <div className="flex items-center gap-3 mt-1">
             <p className="text-slate-500 font-medium text-xs uppercase tracking-widest opacity-70">Infrastructure Performance Monitoring</p>
             <div className="h-4 w-[1.5px] bg-slate-200" />
             {/* Channel Switcher */}
             <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm gap-1">
                {(['all', 'whatsapp', 'website'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      channel === c ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {c}
                  </button>
                ))}
             </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {trendData && trendData.length > 0 && <ExportButton data={trendData} filename="analytics_volume_trend" />}
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Live Sync</span>
           </div>
        </div>
      </div>

      {/* Top Pro Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Inbound', value: currentStats.in.toLocaleString(), sub: '(Active Traffic)', color: 'text-emerald-500' },
          { label: 'Total Outbound', value: currentStats.out.toLocaleString(), sub: '(Message Flow)', color: 'text-blue-500' },
          { label: 'Success Rate', value: `${successRate}%`, sub: 'Infrastructure Quality', color: 'text-brand-gold' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-xl py-6 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-50 group-hover:bg-brand-gold transition-colors duration-500" />
             <CardContent className="flex flex-col items-center justify-center space-y-2">
                <span className={cn("text-5xl font-black tracking-tighter", stat.color)}>{stat.value}</span>
                <div className="flex flex-col items-center">
                   <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{stat.label}</span>
                   <span className="text-[10px] text-slate-400 font-bold italic">{stat.sub}</span>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Bar Chart Overhaul */}
      <Card className="bg-white border-slate-200 shadow-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
           <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Daily Message Volume</CardTitle>
                <p className="text-[10px] text-slate-400 font-bold mt-1">
                  Last 7 days {channel === 'all' ? 'consolidated' : channel} inbound vs outbound traffic
                </p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Inbound</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Outbound</span></div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8 h-[400px]">
          {trendLoading ? (
             <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(4px)' }}
                />
                <Bar 
                  dataKey={channel === 'whatsapp' ? 'waIn' : channel === 'website' ? 'wbIn' : 'inbound'} 
                  fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} 
                />
                <Bar 
                  dataKey={channel === 'whatsapp' ? 'waOut' : channel === 'website' ? 'wbOut' : 'outbound'} 
                  fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Grid for Pie and Trend Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="bg-white border-slate-200 shadow-xl overflow-hidden">
            <CardHeader className="py-6 border-b border-slate-50">
               <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Message Success Rate</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%" cy="50%" innerRadius={85} outerRadius={110} paddingAngle={10}
                      dataKey="value" stroke="none"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DIST_COLORS[index % DIST_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{successRate}%</span>
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">Operational</span>
               </div>
            </CardContent>
         </Card>

         <Card className="bg-white border-slate-200 shadow-xl overflow-hidden">
            <CardHeader className="py-6 border-b border-slate-50">
               <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Conversations Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-8">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inbound" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }} 
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
