'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Bot, Users, Zap, ShieldCheck,
  Download, Settings, BarChart2, Code2, MessageSquare, GitBranch,
  CreditCard, LogOut, ChevronRight, Building2, HelpCircle,
  UserPlus, Globe, Languages, Mail, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

// ─── Content for confirmation modals ────────────────────────────────────────
const MODAL_CONTENT = {
  master_on: {
    icon: 'gold',
    titleEn: 'Turn ON AI Auto-Reply for All Existing Chats?',
    bodyEn:
      'The AI will start automatically replying to all your existing contacts. This will not affect new users — that is controlled separately below. You can still turn AI off for any individual chat at any time.',
    bodyHi:
      'AI आपके सभी मौजूदा contacts को automatically reply करना शुरू कर देगा। नए users पर इसका असर नहीं होगा — वो नीचे अलग से control होता है। आप किसी भी chat के लिए अलग से AI बंद कर सकते हैं।',
    confirmLabel: 'Yes, Turn ON',
    confirmClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  },
  master_off: {
    icon: 'red',
    titleEn: 'Turn OFF AI Auto-Reply for All Existing Chats?',
    bodyEn:
      'The AI will stop replying to ALL your existing contacts immediately. Manually created chats will go to Manual Mode. The "AI for New Users" setting below will still apply to brand new contacts who message for the first time.',
    bodyHi:
      'AI तुरंत सभी मौजूदा contacts के लिए बंद हो जाएगा। Chats Manual Mode में चली जाएंगी। "नए Users के लिए AI" की setting नीचे अभी भी काम करेगी — जो पहली बार message करें उनके लिए।',
    confirmLabel: 'Yes, Turn OFF',
    confirmClass: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
  },
  newuser_on: {
    icon: 'gold',
    titleEn: 'Turn ON AI for New Users?',
    bodyEn:
      'Any new contact who messages you for the very first time will automatically have AI replies enabled. This does NOT change settings for your existing contacts — only future, brand-new users are affected.',
    bodyHi:
      'जो भी नया contact पहली बार message करेगा, उसके लिए AI automatically चालू होगी। इससे आपके existing contacts की settings नहीं बदलेंगी — सिर्फ भविष्य के नए users पर असर होगा।',
    confirmLabel: 'Yes, Enable for New Users',
    confirmClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  },
  newuser_off: {
    icon: 'red',
    titleEn: 'Turn OFF AI for New Users?',
    bodyEn:
      'New contacts who message you for the first time will NOT receive AI replies — even if the main "AI Auto-Reply" switch is ON. You can still manually enable AI for them later inside their individual chat.',
    bodyHi:
      'जो नया contact पहली बार message करेगा, उसे AI reply नहीं जाएगा — भले ही ऊपर वाला "AI Auto-Reply" ON हो। आप बाद में उनकी individual chat में जाकर manually AI चालू कर सकते हैं।',
    confirmLabel: 'Yes, Disable for New Users',
    confirmClass: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
  },
} as const;

type ModalKey = keyof typeof MODAL_CONTENT;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, accountType, adminData } = useAuth();
  const { isInstallable, installApp } = usePWA();

  // ── State ────────────────────────────────────────────────────────────────
  const [masterAi, setMasterAi] = useState(adminData?.globalAiEnabled ?? false);
  const [newUserAi, setNewUserAi] = useState(adminData?.ai_default_enabled ?? true);
  const [aiLoading, setAiLoading] = useState(false);
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pendingModal, setPendingModal] = useState<ModalKey | null>(null);
  const [showHindi, setShowHindi] = useState(false);
  const [dailySent, setDailySent] = useState(0);

  // ── Navigation links ─────────────────────────────────────────────────────
  const isGmail = pathname.startsWith('/gmail');

  useEffect(() => {
    if (!isGmail) return;
    const fetchQuota = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/gmail/campaigns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.stats && typeof data.stats.todaySent === 'number') {
           setDailySent(data.stats.todaySent);
        }
      } catch (err) {
        console.log('Quota fetch failed', err);
      }
    };
    fetchQuota();
  }, [isGmail, pathname]);

  const mainLinks = isGmail ? [
    { href: '/gmail/dashboard', label: 'Gmail Dashboard', icon: LayoutDashboard },
  ] : [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inbox', label: 'Inbox', icon: Inbox, badge: 'WhatsApp' },
  ];

  const headOnlyLinks = role !== 'agent' ? (isGmail ? [
    { href: '/gmail/campaigns', label: 'Campaigns', icon: Zap },
    { href: '/gmail/drafts', label: 'Drafts', icon: FileText },
    { href: '/gmail/templates', label: 'Templates', icon: MessageSquare },
    { href: '/gmail/settings', label: 'Gmail Settings', icon: Settings },
  ] : [
    { href: '/ai-config', label: 'AI Setup', icon: Bot },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/widget', label: 'Website Widget', icon: Code2 },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/settings', label: 'Settings & API', icon: Settings },
  ]) : [];

  const adminLinks = (role === 'superadmin' && !isGmail) ? [
    { href: '/logs', label: 'System Logs', icon: ShieldCheck },
  ] : [];

  const supportLinks = [
    { href: isGmail ? '/gmail/support' : '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  // ── Toggle handlers ──────────────────────────────────────────────────────
  const openModal = (key: ModalKey) => {
    if (role === 'agent') {
      toast.error('Only Company Head can change AI settings.');
      return;
    }
    setShowHindi(false);
    setPendingModal(key);
  };

  const handleMasterClick = () =>
    openModal(masterAi ? 'master_off' : 'master_on');

  const handleNewUserClick = () =>
    openModal(newUserAi ? 'newuser_off' : 'newuser_on');

  const confirmAction = async () => {
    if (!pendingModal) return;
    const isMaster = pendingModal.startsWith('master');
    const targetEnabled = pendingModal.endsWith('_on');

    if (isMaster) {
      setAiLoading(true);
      try {
        const res = await fetch('/api/user/master-ai-toggle', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ enabled: targetEnabled }),
        });
        if (!res.ok) throw new Error('Failed to toggle');
        setMasterAi(targetEnabled);
        toast.success(`AI Auto-Reply ${targetEnabled ? 'enabled ⚡ for all existing chats' : 'disabled for all existing chats'}`);
      } catch {
        toast.error('Could not update AI Auto-Reply. Please try again.');
      } finally {
        setAiLoading(false);
      }
    } else {
      setNewUserLoading(true);
      try {
        const res = await fetch('/api/user/new-user-ai-toggle', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ enabled: targetEnabled }),
        });
        if (!res.ok) throw new Error('Failed to toggle');
        setNewUserAi(targetEnabled);
        toast.success(`AI for New Users ${targetEnabled ? 'enabled ⚡' : 'disabled'}`);
      } catch {
        toast.error('Could not update New User AI setting. Please try again.');
      } finally {
        setNewUserLoading(false);
      }
    }

    setPendingModal(null);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(auth);
    document.cookie = 'firebase-token=; path=/; max-age=0';
    router.push('/login');
  };

  // ── Sub-components ───────────────────────────────────────────────────────
  const NavLink = ({ href, label, icon: Icon, badge }: any) => (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
        pathname === href || pathname.startsWith(href + '/')
          ? 'bg-slate-900 text-white shadow-lg'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0',
        pathname === href ? 'text-brand-gold' : 'text-slate-400 group-hover:text-slate-600'
      )} />
      <span className="text-[13px] font-bold flex-1">{label}</span>
      {badge && (
        <span className={cn(
          'text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded',
          pathname === href ? 'bg-brand-gold/20 text-brand-gold' : 'bg-slate-100 text-slate-400'
        )}>{badge}</span>
      )}
      {(pathname === href || pathname.startsWith(href + '/')) && (
        <ChevronRight className="w-3 h-3 text-brand-gold" />
      )}
    </Link>
  );

  // A single AI toggle row inside the card
  const AiToggleRow = ({
    icon: Icon,
    label,
    sublabel,
    active,
    loading,
    onClick,
    iconColor,
  }: {
    icon: any;
    label: string;
    sublabel: string;
    active: boolean;
    loading: boolean;
    onClick: () => void;
    iconColor: string;
  }) => (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border',
        active
          ? 'bg-amber-50 border-amber-200/60'
          : 'bg-slate-50 border-slate-100 hover:border-slate-200'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0', active ? 'bg-amber-100' : 'bg-slate-100')}>
          <Icon className={cn('w-3 h-3', active ? iconColor : 'text-slate-400')} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-[9px] font-black uppercase tracking-widest leading-tight', active ? 'text-slate-700' : 'text-slate-500')}>
            {label}
          </p>
          <p className={cn('text-[7.5px] font-bold uppercase tracking-tight leading-tight mt-0.5', active ? 'text-amber-500' : 'text-slate-400')}>
            {sublabel}
          </p>
        </div>
      </div>
      {/* Toggle pill */}
      <div className={cn(
        'w-9 h-5 rounded-full relative transition-all duration-300 border flex-shrink-0',
        loading ? 'opacity-40 pointer-events-none' : '',
        active ? 'bg-amber-400 border-amber-400' : 'bg-slate-200 border-slate-200'
      )}>
        <div className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm',
          active ? 'left-4' : 'left-0.5'
        )} />
      </div>
    </div>
  );

  // ── Modal content ────────────────────────────────────────────────────────
  const modal = pendingModal ? MODAL_CONTENT[pendingModal] : null;

  return (
    <aside className="w-60 bg-white border-r border-slate-100 text-slate-500 flex flex-col h-[calc(100vh)] z-50 flex-shrink-0 relative">

      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <Link href={isGmail ? "/gmail/dashboard" : "/dashboard"} className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex-shrink-0">
            <div className={cn("absolute inset-0 blur-lg rounded-xl transition-all", isGmail ? "bg-red-500/20 group-hover:bg-red-500/30" : "bg-brand-gold/20 group-hover:bg-brand-gold/30")} />
            <div className="relative w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 p-1.5 overflow-hidden">
               {isGmail ? (
                 <Mail className="w-5 h-5 text-red-500" />
               ) : (
                 <img src="/logopro.png" alt="Solid Models" className="w-full h-full object-contain" />
               )}
            </div>
          </div>
          <div>
            <span className="text-[13px] font-black text-slate-900 tracking-tight uppercase block leading-tight">
              {isGmail ? "Gmail Panel" : "Solid Models"}
            </span>
            <span className={cn("text-[7px] font-bold uppercase tracking-[0.15em]", isGmail ? "text-red-500" : "text-brand-gold")}>
              {isGmail ? "Email Platform" : "AI Platform"}
            </span>
          </div>
        </Link>

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
            {adminLinks.map((link: any) => <NavLink key={link.href} {...link} />)}
          </>
        )}

        <div className="pt-3 pb-1 px-4">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Support</span>
        </div>
        {supportLinks.map((link: any) => <NavLink key={link.href} {...link} />)}
      </nav>

      {/* Bottom Panel */}
      <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4 bg-white relative z-10">

        {!isGmail && (
          <>
            {/* ── AI Auto-Reply Controls Card ── */}
            <div className={cn(
              'rounded-2xl border transition-all duration-500 overflow-hidden',
              (masterAi || newUserAi) ? 'border-amber-200/60' : 'border-slate-100'
            )}>
              {/* Card header */}
              <div className={cn(
                'px-3 py-2 flex items-center gap-2 border-b',
                (masterAi || newUserAi) ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
              )}>
                <div className={cn('w-5 h-5 rounded-md flex items-center justify-center', (masterAi || newUserAi) ? 'bg-amber-400' : 'bg-slate-200')}>
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div>
                  <span className={cn('text-[9px] font-black uppercase tracking-widest block leading-tight', (masterAi || newUserAi) ? 'text-slate-700' : 'text-slate-500')}>
                    AI Auto-Reply
                  </span>
                  <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wide">WhatsApp reply controls</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="p-2 space-y-1.5 bg-white">
                <AiToggleRow
                  icon={Globe}
                  label="All Existing Chats"
                  sublabel={masterAi ? 'AI replying to everyone' : 'Manual mode — AI off'}
                  active={masterAi}
                  loading={aiLoading}
                  onClick={handleMasterClick}
                  iconColor="text-amber-500"
                />
                <AiToggleRow
                  icon={UserPlus}
                  label="New Users (First Message)"
                  sublabel={newUserAi ? 'AI ON for new contacts' : 'AI OFF for new contacts'}
                  active={newUserAi}
                  loading={newUserLoading}
                  onClick={handleNewUserClick}
                  iconColor="text-amber-500"
                />
              </div>

              {/* Status hint */}
              <div className={cn(
                'px-3 py-1.5 border-t',
                (masterAi || newUserAi) ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
              )}>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">
                  {!masterAi && !newUserAi
                    ? '⛔ AI fully paused — all manual'
                    : masterAi && newUserAi
                    ? '✅ AI active for all: existing & new'
                    : masterAi && !newUserAi
                    ? '⚡ AI on for existing · off for new'
                    : '🔔 AI off for existing · on for new users'}
                </p>
              </div>
            </div>
          </>
        )}

        {isGmail && (
          <div className="rounded-2xl border border-red-100 bg-red-50/30 p-3">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-red-500 rounded-lg">
                   <Mail className="w-3 h-3 text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Daily Quota</span>
             </div>
             <div className="space-y-1.5">
                <div className="flex justify-between text-[7px] font-black uppercase text-slate-400">
                   <span>Emails Sent</span>
                   <span>{dailySent} / 500</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-red-500 transition-all duration-1000" 
                     style={{ width: `${Math.min(100, (dailySent / 500) * 100)}%` }}
                   />
                </div>
             </div>
          </div>
        )}

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
          <Link href={isGmail ? "/gmail/settings" : "/settings"} className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-gold/30 transition-all">
            {isGmail ? <Mail className="w-3 h-3 text-red-500" /> : <CreditCard className="w-3 h-3 text-brand-gold" />}
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 truncate capitalize">
              {isGmail ? "Gmail Setup" : (adminData?.planId?.replace('_', ' ') || 'Free Trial')}
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

      {/* ── Confirmation Modal ── */}
      {pendingModal && modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 fade-in duration-200">

            {/* Icon */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                modal.icon === 'gold'
                  ? 'bg-amber-400 shadow-amber-400/30'
                  : 'bg-red-500 shadow-red-500/30'
              )}>
                {pendingModal.startsWith('newuser')
                  ? <UserPlus className="w-7 h-7 text-white" />
                  : <Zap className="w-7 h-7 text-white" />
                }
              </div>

              {/* Title */}
              <h3 className="text-[13px] font-black text-slate-900 tracking-tight leading-snug px-2">
                {modal.titleEn}
              </h3>

              {/* Body — English or Hindi */}
              <div className="text-[11px] text-slate-500 font-medium leading-relaxed text-left bg-slate-50 rounded-xl p-3 border border-slate-100 w-full">
                {showHindi ? modal.bodyHi : modal.bodyEn}
              </div>

              {/* Hindi toggle button */}
              <button
                onClick={() => setShowHindi((h) => !h)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors"
              >
                <Languages className="w-3.5 h-3.5" />
                {showHindi ? 'Read in English' : 'हिंदी में पढ़ें'}
              </button>

              {/* Action buttons */}
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setPendingModal(null)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={aiLoading || newUserLoading}
                  className={cn(
                    'flex-1 py-3 text-xs font-black uppercase tracking-widest text-white rounded-xl shadow-lg transition-all',
                    modal.confirmClass,
                    (aiLoading || newUserLoading) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {(aiLoading || newUserLoading) ? 'Saving…' : modal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
