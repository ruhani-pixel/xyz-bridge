'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { 
  Settings as SettingsIcon, Lock, UserCog, Link as LinkIcon, Copy, CheckCircle2,
  CreditCard, Zap, Shield, Clock, Rocket, ArrowUpRight, GitBranch, AlertTriangle,
  MessageSquare, Globe, Mail, Key
} from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { toast } from 'sonner';
import { MSG91SecurityGuide } from '@/components/ui/MSG91SecurityGuide';
import { GmailSecurityGuide } from '@/components/ui/GmailSecurityGuide';

export default function SettingsPage() {
  const { role, user, adminData, loading: authLoading } = useAuth();
  const [originUrl, setOriginUrl] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'gmail' | 'plan' | 'bridge'>('api');
  const [showSecurityGuide, setShowSecurityGuide] = useState(false);
  const [showGmailGuide, setShowGmailGuide] = useState(false);
  const [securityGuideType, setSecurityGuideType] = useState<'ip_blocked' | 'auth_failed'>('ip_blocked');

  // Config State
  const [config, setConfig] = useState({
    msg91_authkey: '',
    msg91_integrated_number: '',
    chatwoot_base_url: 'https://app.chatwoot.com',
    chatwoot_api_token: '',
    chatwoot_account_id: '',
    chatwoot_inbox_id: '',
    gmail_app_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setOriginUrl(window.location.origin);
    const fetchConfig = async () => {
      const token = localStorage.getItem('token');
      try {
        const configRes = await fetch('/api/user/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const configData = await configRes.json();
        if (configData.config) setConfig(configData.config);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveStatus('success');
        toast.success('Configuration saved!');
      } else {
        setSaveStatus('error');
        toast.error('Failed to save');
      }
    } catch {
      setSaveStatus('error');
      toast.error('Connection error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const copyToClipboard = (text: string, type: 'msg91' | 'chatwoot') => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
    if (type === 'msg91') { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000); }
    else { setCopiedChat(true); setTimeout(() => setCopiedChat(false), 2000); }
  };

  if (role === 'agent') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Lock className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Access Restricted</h2>
        <p className="text-slate-400 text-sm text-center max-w-md">Only Company Head can manage settings. Contact your administrator.</p>
      </div>
    );
  }

  const currentPlan = adminData?.planId || 'free_trial';
  const planDetails = currentPlan === 'pro_monthly' ? PLANS.PRO_MONTHLY 
                    : currentPlan === 'enterprise_monthly' ? PLANS.ENTERPRISE_MONTHLY 
                    : PLANS.FREE_TRIAL;

  const tabs = [
    { id: 'api' as const, label: 'API & Webhooks', icon: LinkIcon },
    { id: 'gmail' as const, label: 'Mailing System', icon: Mail },
    { id: 'plan' as const, label: 'Subscription', icon: CreditCard },
    { id: 'bridge' as const, label: 'Bridge Mode', icon: GitBranch },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Settings</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Configuration & Integrations</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB: API & Webhooks */}
      {activeTab === 'api' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl"><Lock className="w-5 h-5 text-brand-gold" /></div>
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-tight">MSG91 & Chatwoot Setup</CardTitle>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connect your WhatsApp provider</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* MSG91 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="w-1.5 h-5 bg-brand-gold rounded-full" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">MSG91</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auth Key</label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!config.msg91_authkey) {
                              toast.error('Please enter Auth Key first');
                              return;
                            }
                            const loadingToast = toast.loading('Verifying MSG91 Auth Key...');
                            try {
                              const res = await fetch('/api/user/verify-msg91', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ authkey: config.msg91_authkey })
                              });
                              const data = await res.json();
                              toast.dismiss(loadingToast);
                              if (data.success) {
                                toast.success(`Connected! Balance: ${data.balance}`);
                              } else {
                                // Show Security Guide popup for IP block or auth errors
                                if (data.error_type === 'ip_blocked' || data.error_type === 'auth_failed') {
                                  setSecurityGuideType(data.error_type);
                                  setShowSecurityGuide(true);
                                } else {
                                  toast.error(data.error || 'Connection Failed');
                                }
                              }
                            } catch {
                              toast.dismiss(loadingToast);
                              toast.error('Server se connection nahi ho paya. Thodi der baad try karein.');
                            }
                          }}
                          className="text-[9px] font-black text-brand-gold hover:text-brand-gold/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                          <Zap className="w-3 h-3" /> Test Connection
                        </button>
                      </div>
                      <input type="password" value={config.msg91_authkey}
                        onChange={(e) => setConfig({...config, msg91_authkey: e.target.value})}
                        placeholder="Your MSG91 Auth Key"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-gold/40 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integrated Number</label>
                      <input type="text" value={config.msg91_integrated_number}
                        onChange={(e) => setConfig({...config, msg91_integrated_number: e.target.value})}
                        placeholder="e.g. 91xxxxxxxxxx"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-gold/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Chatwoot (Bridge) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Chatwoot <span className="text-slate-400">(Optional)</span></h3>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base URL</label>
                      <input type="text" value={config.chatwoot_base_url}
                        onChange={(e) => setConfig({...config, chatwoot_base_url: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400/40 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">API Token</label>
                      <input type="password" value={config.chatwoot_api_token}
                        onChange={(e) => setConfig({...config, chatwoot_api_token: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400/40 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account ID</label>
                        <input type="text" value={config.chatwoot_account_id}
                          onChange={(e) => setConfig({...config, chatwoot_account_id: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400/40 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inbox ID</label>
                        <input type="text" value={config.chatwoot_inbox_id}
                          onChange={(e) => setConfig({...config, chatwoot_inbox_id: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400/40 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button type="submit" disabled={saving}
                    className="h-11 px-8 bg-brand-gold hover:bg-brand-gold/90 text-white rounded-xl shadow-lg shadow-brand-gold/20 font-black uppercase text-[10px] tracking-widest"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Webhook URLs */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><LinkIcon className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-tight">Webhook URLs</CardTitle>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Paste these in MSG91 & Chatwoot</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    MSG91 Inbound <span className="text-emerald-500">● Input</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-xs text-slate-600 truncate">{originUrl}/api/msg91-webhook</div>
                    <button onClick={() => copyToClipboard(`${originUrl}/api/msg91-webhook`, 'msg91')}
                      className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      {copiedMsg ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Chatwoot Outbound <span className="text-blue-500">● Output</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-xs text-slate-600 truncate">{originUrl}/api/chatwoot-webhook</div>
                    <button onClick={() => copyToClipboard(`${originUrl}/api/chatwoot-webhook`, 'chatwoot')}
                      className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      {copiedChat ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: Gmail Mailing System */}
      {activeTab === 'gmail' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
             <CardHeader className="border-b border-slate-100 p-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-xl"><Mail className="w-5 h-5 text-red-500" /></div>
                      <div>
                         <CardTitle className="text-sm font-black uppercase tracking-tight">Gmail SMTP Configuration</CardTitle>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Send mass emails securely</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setShowGmailGuide(true)}
                     className="px-3 py-1.5 bg-red-50 text-[10px] font-black text-red-600 rounded-lg hover:bg-red-100 transition-all uppercase tracking-widest flex items-center gap-2"
                   >
                     <Key className="w-3.5 h-3.5" /> How to Setup?
                   </button>
                </div>
             </CardHeader>
             <CardContent className="p-6">
                <form onSubmit={handleSaveConfig} className="space-y-6">
                   <div className="max-w-2xl space-y-6">
                      <div className="space-y-4 p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gmail App Password</label>
                            <button 
                              type="button"
                              onClick={async () => {
                                if (!config.gmail_app_password) {
                                  toast.error('Please enter App Password first');
                                  return;
                                }
                                const loading = toast.loading('Verifying SMTP Connection...');
                                try {
                                  const res = await fetch('/api/gmail/verify', {
                                    method: 'POST',
                                    headers: { 
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    },
                                    body: JSON.stringify({ appPassword: config.gmail_app_password })
                                  });
                                  const data = await res.json();
                                  toast.dismiss(loading);
                                  if (data.success) toast.success('Connection Verified! Ready to send.');
                                  else toast.error(data.error || 'Connection Failed');
                                } catch {
                                  toast.dismiss(loading);
                                  toast.error('Server error. Try again later.');
                                }
                              }}
                              className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-all"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" /> Test Connection
                            </button>
                         </div>
                         <input 
                           type="password" 
                           value={config.gmail_app_password}
                           onChange={(e) => setConfig({...config, gmail_app_password: e.target.value})}
                           placeholder="xxxx xxxx xxxx xxxx"
                           className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-red-500/20 transition-all text-slate-900"
                         />
                         <div className="flex items-start gap-2 pt-2">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                               Daily Limit: 500 recipients (as per Google policy)
                            </p>
                         </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving} className="h-12 px-10 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                          {saving ? 'Saving...' : 'Save Gmail Settings'}
                        </Button>
                      </div>
                   </div>
                </form>
             </CardContent>
            </Card>
        </div>
      )}

      {/* TAB: Subscription */}
      {activeTab === 'plan' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Current Plan */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center">
                    {currentPlan === 'enterprise_monthly' ? <Shield className="w-7 h-7 text-brand-gold" />
                     : currentPlan === 'pro_monthly' ? <Rocket className="w-7 h-7 text-brand-gold" />
                     : <Clock className="w-7 h-7 text-brand-gold" />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Plan</p>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{planDetails.name}</h2>
                    <p className="text-sm text-slate-500 font-bold mt-1">₹{planDetails.price}/month • {(adminData?.messageCount || 0).toLocaleString()}/{planDetails.messageLimit.toLocaleString()} messages used</p>
                  </div>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                  Upgrade Plan <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Usage bar */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>Message Usage</span>
                  <span>{Math.round(((adminData?.messageCount || 0) / planDetails.messageLimit) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-gold rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((adminData?.messageCount || 0) / planDetails.messageLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planDetails.features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <span className="text-sm font-bold text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Bridge Mode */}
      {activeTab === 'bridge' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-7 h-7 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Bridge Mode</h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    When Bridge Mode is ON for a contact, messages are forwarded to your Chatwoot instance instead of being handled by our AI inbox.
                    This is useful if you already use Chatwoot and want to continue using it.
                  </p>
                  
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <strong>Important:</strong> Bridge mode and AI inbox cannot run simultaneously for the same contact.
                      Toggle per-contact in your <strong>Inbox → Contact Details</strong>.
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <MessageSquare className="w-5 h-5 text-brand-gold mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-900">Solid Models Inbox</p>
                      <p className="text-[10px] text-slate-400 mt-1">AI replies, manual chat, full control</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <Globe className="w-5 h-5 text-blue-500 mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-900">Chatwoot Bridge</p>
                      <p className="text-[10px] text-slate-400 mt-1">Forward to Chatwoot, external CRM</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MSG91 Security Guide Popup */}
      <MSG91SecurityGuide 
        isOpen={showSecurityGuide} 
        onClose={() => setShowSecurityGuide(false)}
        errorType={securityGuideType}
      />

      {/* Gmail Setup Guide Popup */}
      <GmailSecurityGuide 
        isOpen={showGmailGuide} 
        onClose={() => setShowGmailGuide(false)}
      />
    </div>
  );
}
