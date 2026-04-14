'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Inbox, Bot, Users, Zap, ShieldCheck, 
  Download, Settings, BarChart2, Code2, MessageSquare, GitBranch,
  CreditCard, LogOut, ChevronRight, Building2, HelpCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, accountType, adminData } = useAuth();
  const { isInstallable, installApp } = usePWA();

  const [aiLoading, setAiLoading] = useState(false);
  const [masterAi, setMasterAi] = useState(adminData?.globalAiEnabled ?? false);
  const [signingOut, setSigningOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // SaaS Navigation — Shared
  const mainLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 'WhatsApp' },
  ];

  // Company Head only features
  const headOnlyLinks = role !== 'agent' ? [
    { href: '/ai-config', label: 'AI Setup', icon: Bot },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/widget', label: 'Website Widget', icon: Code2 },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/settings', label: 'Settings & API', icon: Settings },
  ] : [];

  // Super-admin panel
  const adminLinks = role === 'superadmin' ? [
    { href: '/logs', label: 'System Logs', icon: ShieldCheck },
  ] : [];

  // Help & Support at the very bottom
  const supportLinks = [
     { href: '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  const confirmToggle = async () => {
    if (role === 'agent') {
      toast.error('Only Company Head can toggle Master AI.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/user/master-ai-toggle', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled: !masterAi })
      });
      if (!res.ok) throw new Error('Failed to toggle');
      setMasterAi(!masterAi);
      setShowConfirmModal(false);
      toast.success(`AI Pilot: ${!masterAi ? 'Engaged ⚡' : 'Standby'}`);
    } catch {
      toast.error('AI Pilot error. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(auth);
    document.cookie = 'firebase-token=; path=/; max-age=0';
    router.push('/login');
  };

  const NavLink = ({ href, label, icon: Icon, badge }: any) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
        pathname === href || pathname.startsWith(href + '/')
          ? "bg-slate-900 text-white shadow-lg"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0", 
        pathname === href ? "text-brand-gold" : "text-slate-400 group-hover:text-slate-600"
      )} />
      <span className="text-sm font-bold flex-1">{label}</span>
      {badge && (
        <span className={cn(
          "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
          pathname === href ? "bg-brand-gold/20 text-brand-gold" : "bg-slate-100 text-slate-400"
        )}>{badge}</span>
      )}
      {(pathname === href || pathname.startsWith(href + '/')) && (
        <ChevronRight className="w-3 h-3 text-brand-gold" />
      )}
    </Link>
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-100 text-slate-500 flex flex-col h-[calc(100vh)] z-50 flex-shrink-0 relative">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="absolute inset-0 bg-brand-gold/20 blur-lg rounded-xl group-hover:bg-brand-gold/30 transition-all" />
            <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 p-1.5">
              <img src="/logopro.png" alt="Solid Models" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 tracking-tight uppercase block leading-tight">Solid Models</span>
            <span className="text-[8px] text-brand-gold font-bold uppercase tracking-[0.15em]">AI Platform</span>
          </div>
        </Link>

        {/* Company name if available */}
        {adminData?.companyName && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-[10px] font-black text-slate-600 truncate uppercase tracking-wider">{adminData.companyName}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {mainLinks.map((link) => <NavLink key={link.href} {...link} />)}

        {headOnlyLinks.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-4">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Management</span>
            </div>
            {headOnlyLinks.map((link) => <NavLink key={link.href} {...link} />)}
          </>
        )}

        {adminLinks.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-4">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Admin</span>
            </div>
            {adminLinks.map((link) => <NavLink key={link.href} {...link} />)}
          </>
        )}

        {/* Support at the bottom of the scrollable area */}
        <div className="pt-3 pb-1 px-4">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Support</span>
        </div>
        {supportLinks.map((link) => <NavLink key={link.href} {...link} />)}
      </nav>

      {/* Bottom Panel */}
      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4 bg-white relative z-10">
        {/* Master AI Pilot Toggle */}
        <div className={cn(
          "p-4 rounded-2xl border transition-all duration-500 cursor-pointer",
          masterAi 
            ? "bg-brand-gold/5 border-brand-gold/20" 
            : "bg-slate-50 border-slate-100"
        )} onClick={() => {
           if (role === 'agent') return toast.error('Only Company Head can toggle Master AI.');
           setShowConfirmModal(true);
        }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-3.5 h-3.5", masterAi ? "text-brand-gold fill-brand-gold" : "text-slate-400")} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">AI Pilot</span>
            </div>
            <div className={cn(
              "w-9 h-5 rounded-full relative transition-all duration-300 border",
              aiLoading ? "opacity-50" : "",
              masterAi ? "bg-brand-gold border-brand-gold" : "bg-slate-200 border-slate-200"
            )}>
              <div className={cn(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                masterAi ? "left-4" : "left-0.5"
              )} />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
            {masterAi ? "AI handling all chats" : "Manual mode — AI standby"}
          </p>
        </div>

        {/* PWA Install */}
        {isInstallable && (
          <button
            onClick={installApp}
            className="w-full p-3 bg-brand-gold rounded-xl flex items-center gap-3 hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/20"
          >
            <Download className="w-4 h-4 text-white flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Install App</span>
              <span className="text-[7px] text-white/70 font-bold uppercase">Faster Access</span>
            </div>
          </button>
        )}

        {/* Plan Badge + Sign Out */}
        <div className="flex items-center gap-2">
          <Link href="/settings" className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-gold/30 transition-all">
            <CreditCard className="w-3 h-3 text-brand-gold" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 truncate capitalize">
              {adminData?.planId?.replace('_', ' ') || 'Free Trial'}
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all text-slate-400"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 relative overflow-hidden">
             
             <div className="flex flex-col items-center text-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                  masterAi ? "bg-red-500 shadow-red-500/20" : "bg-brand-gold shadow-brand-gold/20"
                )}>
                   <Zap className="w-6 h-6 text-white" />
                </div>
                
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mt-2 px-2">
                     {masterAi ? "Disable AI for everyone?" : "Enable AI for everyone?"}
                   </h3>
                   <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                     {masterAi 
                       ? "Off karte hi saare users ke liye AI reply block ho jayega. Sirf jab aap individually ON karenge kisi chat me, tabhi reply jayega." 
                       : "On karne par ab sabhi aane wale clients ko AI apne aap reply karna shuru kar dega."}
                   </p>
                </div>
                
                <div className="flex gap-3 w-full mt-4">
                   <button 
                     onClick={() => setShowConfirmModal(false)}
                     className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={confirmToggle}
                     className={cn(
                       "flex-1 py-3 text-xs font-black uppercase tracking-widest text-white rounded-xl shadow-lg transition-all",
                       masterAi ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-brand-gold hover:bg-brand-gold/90 shadow-brand-gold/20"
                     )}
                   >
                     {masterAi ? "Yes, Turn Off" : "Yes, Turn On"}
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}
    </aside>
  );
}
