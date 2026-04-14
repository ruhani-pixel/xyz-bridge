import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  const isPositive = trend === 'up';
  
  // Dynamic gradient themes
  const getTheme = () => {
    const t = title.toLowerCase();
    if (t.includes('message')) return 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/10 text-emerald-600 icon-bg-emerald-500';
    if (t.includes('outbound')) return 'from-blue-500/10 to-blue-500/5 border-blue-500/10 text-blue-600 icon-bg-blue-500';
    if (t.includes('inbound')) return 'from-purple-500/10 to-purple-500/5 border-purple-500/10 text-purple-600 icon-bg-purple-500';
    if (t.includes('fail')) return 'from-rose-500/10 to-rose-500/5 border-rose-500/10 text-rose-600 icon-bg-rose-500';
    return 'from-brand-gold/10 to-brand-gold/5 border-brand-gold/10 text-brand-gold icon-bg-brand-gold';
  };

  const theme = getTheme();
  const iconBg = theme.split('icon-bg-')[1];

  return (
    <Card className={cn(
      "relative overflow-hidden border bg-gradient-to-br transition-all duration-500 group rounded-[2.5rem] p-8",
      theme.split(' icon-bg-')[0]
    )}>
      {/* Background Decorative Element */}
      <div className={cn(
        "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-all duration-700 group-hover:scale-150",
        `bg-${iconBg}`
      )} />

      <CardHeader className="flex flex-row items-center justify-between p-0 mb-6">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
          `bg-${iconBg} text-white shadow-${iconBg}/20`
        )}>
          <Icon className="w-7 h-7" />
        </div>
        {trend && (
           <div className={cn(
             "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
             isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
           )}>
             {isPositive ? '↑ 12%' : '↓ 8%'}
           </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</span>
          <div className="text-5xl font-extrabold text-slate-900 tracking-tighter mb-2 group-hover:translate-x-1 transition-transform duration-500">{value}</div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
