'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  Lock, Mail, Key, Shield, AlertTriangle, Zap,
  CheckCircle2, Copy, ExternalLink, RefreshCw, Info,
  Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { GmailSecurityGuide } from '@/components/ui/GmailSecurityGuide';

export default function GmailSettingsPage() {
  const { role, user, adminData } = useAuth();
  const [showGmailGuide, setShowGmailGuide] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [config, setConfig] = useState({ gmail_email: '', gmail_app_password: '' });

  useEffect(() => {
    const fetchConfig = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.config) {
          setConfig({
            gmail_email: data.config.gmail_email || '',
            gmail_app_password: data.config.gmail_app_password || '',
          });
          if (data.config.gmail_email && data.config.gmail_app_password) setVerified(true);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ gmail_email: config.gmail_email, gmail_app_password: config.gmail_app_password }),
      });
      if (res.ok) toast.success('Gmail credentials saved!');
      else toast.error('Failed to save');
    } catch { toast.error('Connection error'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!config.gmail_email || !config.gmail_app_password) {
      toast.error('Enter email and password first');
      return;
    }
    setTesting(true);
    const loadId = toast.loading('Verifying SMTP connection...');
    try {
      const res = await fetch('/api/gmail/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ senderEmail: config.gmail_email, appPassword: config.gmail_app_password }),
      });
      const data = await res.json();
      toast.dismiss(loadId);
      if (data.success) {
        setVerified(true);
        toast.success('✅ Connection verified! Ready to send.');
        // Auto-save on successful verification
        await fetch('/api/user/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ gmail_email: config.gmail_email, gmail_app_password: config.gmail_app_password }),
        });
      } else {
        setVerified(false);
        toast.error(data.error || 'Connection failed');
      }
    } catch {
      toast.dismiss(loadId);
      toast.error('Network timeout');
    } finally { setTesting(false); }
  };

  if (role === 'agent') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Lock className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-sm font-black text-slate-800 uppercase">Access Restricted</h2>
        <p className="text-xs text-slate-400">Only Company Head can manage settings.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Gmail <span className="text-red-500">Configuration</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            SMTP credentials • Securely stored in your account
          </p>
        </div>
        {verified && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">SMTP Active</span>
          </div>
        )}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN: Form (takes 2/3 width) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Credentials Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">SMTP Credentials</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Connect your Gmail account</p>
                </div>
              </div>
              <button
                onClick={() => setShowGmailGuide(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <Key className="w-3 h-3" /> Setup Guide
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Gmail Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Gmail Address
                  </label>
                  {verified && (
                    <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={config.gmail_email}
                    onChange={e => { setConfig(p => ({ ...p, gmail_email: e.target.value })); setVerified(false); }}
                    placeholder="you@gmail.com"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:border-red-400/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* App Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">App Password</label>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    Generate <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={config.gmail_app_password}
                    onChange={e => { setConfig(p => ({ ...p, gmail_app_password: e.target.value })); setVerified(false); }}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full h-11 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm tracking-widest focus:outline-none focus:border-red-400/50 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Warning */}
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                    Make sure <strong>2-Step Verification</strong> is enabled on your Google account before generating an App Password.
                    Gmail daily limit is <strong>500 emails</strong>.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !config.gmail_email || !config.gmail_app_password}
                  className={cn(
                    'h-10 px-5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 transition-all border',
                    verified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {testing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : verified ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 fill-current" />
                  )}
                  {verified ? 'Verified ✓' : 'Test Connection'}
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </div>

          {/* Quick Tips */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400" /> How to get an App Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { step: '1', text: 'Go to your Google Account settings', href: 'https://myaccount.google.com' },
                { step: '2', text: 'Enable 2-Step Verification first', href: 'https://myaccount.google.com/security' },
                { step: '3', text: 'Click "App Passwords" under Security', href: 'https://myaccount.google.com/apppasswords' },
                { step: '4', text: 'Select "Mail" → "Windows Computer" → Generate', href: null },
              ].map(({ step, text, href }) => (
                <div key={step} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="w-6 h-6 flex-shrink-0 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                    {step}
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{text}</p>
                    {href && (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-0.5">
                        Open <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Security info + Limits ── */}
        <div className="space-y-5">
          {/* Security Vault */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-tight mb-2">Secure Vault</h3>
              <p className="text-[12px] text-white/60 leading-relaxed">
                Your App Password is stored encrypted in our Firestore database. It is never exposed to the browser or frontend code.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                {[
                  'End-to-end encrypted storage',
                  'Server-side SMTP only',
                  'Token-auth protected API',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[10px] text-white/50 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gmail Limits */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Gmail Sending Limits</h3>
            {[
              { label: 'Daily limit', value: '500 emails', color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Per-hour (safe)', value: '~80 emails', color: 'bg-blue-100 text-blue-700' },
              { label: 'Recommended max', value: '480/day', color: 'bg-amber-100 text-amber-700' },
              { label: 'Cooldown period', value: '24 hours', color: 'bg-slate-100 text-slate-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">{label}</span>
                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-lg', color)}>{value}</span>
              </div>
            ))}
          </div>

          {/* Plan note */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Active Plan</p>
            <p className="text-sm font-black text-red-900 uppercase">{adminData?.planId || 'Spark Plan'}</p>
            <p className="text-[10.5px] text-red-700/70 mt-2 leading-relaxed">
              Gmail sending is included in all plans including Spark. No additional cost.
            </p>
          </div>
        </div>
      </div>

      <GmailSecurityGuide isOpen={showGmailGuide} onClose={() => setShowGmailGuide(false)} />
    </div>
  );
}
