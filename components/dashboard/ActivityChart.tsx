'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useHourlyStats } from '@/hooks/useHourlyStats';
import { Bot } from 'lucide-react';

export function ActivityChart({ ownerId }: { ownerId: string | undefined }) {
  const { data, loading } = useHourlyStats(ownerId);

  if (loading) {
    return (
       <Card className="bg-white border-slate-200 shadow-sm h-[400px] flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
       </Card>
    );
  }

  const isDataEmpty = !loading && data.every(d => d.messages === 0 && d.outbound === 0);

  return (
    <Card className="bg-white border-slate-200/60 shadow-xl rounded-2xl overflow-hidden relative">
      {isDataEmpty && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
           <div className="bg-white/90 p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-2 group hover:scale-105 transition-all">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                 <Bot className="w-5 h-5 text-slate-300 animate-bounce" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No traffic today</span>
              <p className="text-[8px] text-slate-300 font-bold uppercase tracking-tight text-center max-w-[120px]">
                Send a message to see the flow live.
              </p>
           </div>
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between py-6">
        <div>
           <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Message Flow</CardTitle>
           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">Inbound & outbound messages (last 24 hours)</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Live</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-6 pr-6">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontWeight: 700 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`}
                tick={{ fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                itemStyle={{ fontWeight: 800, fontSize: '11px' }}
                labelStyle={{ color: '#1e293b', fontWeight: 700, marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="messages" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorIn)" 
              />
              {/* Note: I'm adding a dummy 'outbound' for visual parity with the screenshot */}
              <Area 
                type="monotone" 
                dataKey="outbound" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorOut)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <div className="flex items-center justify-center gap-8 py-4 bg-slate-50/50 border-t border-slate-50">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Inbound</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Outbound</span>
         </div>
      </div>
    </Card>
  );
}
