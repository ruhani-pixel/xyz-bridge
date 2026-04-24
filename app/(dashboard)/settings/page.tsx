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
  const [showFlowGuide, setShowFlowGuide] = useState(false);
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
    accountType: 'platform' as 'bridge' | 'platform',
    bridgeEnabled: false,
    platformEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [fetchingChatwoot, setFetchingChatwoot] = useState(false);
  const [chatwootConnected, setChatwootConnected] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inboxes, setInboxes] = useState<any[]>([]);
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

  const handleFetchChatwoot = async (accountIdOverride?: string) => {
    if (!config.chatwoot_base_url || !config.chatwoot_api_token) {
      toast.error('Enter Base URL and API Token first');
      return;
    }
    setFetchingChatwoot(true);
    try {
      const res = await fetch('/api/user/fetch-chatwoot-details', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          base_url: config.chatwoot_base_url,
          api_token: config.chatwoot_api_token,
          account_id: accountIdOverride || config.chatwoot_account_id || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setInboxes(data.inboxes || []);
        setChatwootConnected(true);
        setConfig(prev => ({ 
          ...prev, 
          chatwoot_account_id: data.selectedAccountId?.toString() || prev.chatwoot_account_id,
          chatwoot_inbox_id: data.inboxes[0]?.id?.toString() || prev.chatwoot_inbox_id
        }));
        toast.success(`Connected! Found ${data.accounts.length} account(s) & ${data.inboxes.length} inbox(es)`);
      } else {
        toast.error(data.error || 'Failed to connect');
        setChatwootConnected(false);
      }
    } catch {
      toast.error('Connection error — check Base URL');
      setChatwootConnected(false);
    } finally {
      setFetchingChatwoot(false);
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
    { id: 'plan' as const, label: 'Subscription', icon: CreditCard },
    { id: 'bridge' as const, label: 'Bridge Mode', icon: GitBranch },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-700">
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

      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
              activeTab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'api' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-brand-gold/10 rounded-lg"><Lock className="w-4 h-4 text-brand-gold" /></div>
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-tight">MSG91 & Chatwoot Setup</CardTitle>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Connect your WhatsApp provider</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowFlowGuide(true)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
                >
                  <Globe className="w-3 h-3" />
                  How it works?
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="w-1.5 h-5 bg-brand-gold rounded-full" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">MSG91</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-0.5 px-1">
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
                                if (data.error_type === 'ip_blocked' || data.error_type === 'auth_failed') {
                                  setSecurityGuideType(data.error_type);
                                  setShowSecurityGuide(true);
                                } else {
                                  toast.error(data.error || 'Connection Failed');
                                }
                              }
                            } catch {
                              toast.dismiss(loadingToast);
                              toast.error('Server connection error.');
                            }
                          }}
                          className="text-[8.5px] font-black text-brand-gold hover:text-brand-gold/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                          <Zap className="w-2.5 h-2.5" /> Test
                        </button>
                      </div>
                      <input type="password" value={config.msg91_authkey}
                        onChange={(e) => setConfig({...config, msg91_authkey: e.target.value})}
                        placeholder="Key"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-brand-gold/40 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Number</label>
                      <input type="text" value={config.msg91_integrated_number}
                        onChange={(e) => setConfig({...config, msg91_integrated_number: e.target.value})}
                        placeholder="91xxxxxxxxxx"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-brand-gold/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* CHATWOOT SECTION - Redesigned */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Chatwoot <span className="text-slate-400">(Optional)</span></h3>
                      {chatwootConnected && (
                        <span className="ml-auto flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      )}
                    </div>

                    {/* Step 1: Base URL */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[8px] font-black flex items-center justify-center">1</span>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Chatwoot URL</label>
                      </div>
                      <input
                        type="text"
                        value={config.chatwoot_base_url}
                        onChange={(e) => { setConfig({...config, chatwoot_base_url: e.target.value}); setChatwootConnected(false); }}
                        placeholder="https://app.chatwoot.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-blue-400/40 transition-all"
                      />
                      <p className="text-[9px] text-slate-400 px-1">Just the domain — no /app/accounts/... path</p>
                    </div>

                    {/* Step 2: API Token + Connect Button */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[8px] font-black flex items-center justify-center">2</span>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">API Token</label>
                        <button
                          type="button"
                          onClick={() => setShowFlowGuide(true)}
                          className="ml-auto text-[8px] text-blue-400 hover:text-blue-600 font-bold uppercase tracking-widest transition-colors"
                        >Where to find?</button>
                      </div>
                      <input
                        type="password"
                        value={config.chatwoot_api_token}
                        onChange={(e) => { setConfig({...config, chatwoot_api_token: e.target.value}); setChatwootConnected(false); }}
                        placeholder="Personal Access Token"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-blue-400/40 transition-all font-mono"
                      />
                    </div>

                    {/* Connect Button */}
                    <button
                      type="button"
                      onClick={() => handleFetchChatwoot()}
                      disabled={fetchingChatwoot || !config.chatwoot_base_url || !config.chatwoot_api_token}
                      className="w-full h-9 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      {fetchingChatwoot ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting...</>
                      ) : chatwootConnected ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Re-Connect Chatwoot</>
                      ) : (
                        <><Zap className="w-3.5 h-3.5" /> Connect Chatwoot & Fetch Inboxes</>
                      )}
                    </button>

                    {/* Step 3: Account Dropdown (auto-populated) */}
                    {accounts.length > 0 && (
                      <div className="space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black flex items-center justify-center">✓</span>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Account</label>
                        </div>
                        <select
                          value={config.chatwoot_account_id}
                          onChange={(e) => {
                            setConfig({...config, chatwoot_account_id: e.target.value});
                            handleFetchChatwoot(e.target.value);
                          }}
                          className="w-full bg-slate-50 border border-emerald-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-emerald-400/60 transition-all"
                        >
                          {accounts.map(ac => (
                            <option key={ac.id} value={ac.id}>{ac.name} (ID: {ac.id})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step 4: Inbox Dropdown (auto-populated) */}
                    {inboxes.length > 0 && (
                      <div className="space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black flex items-center justify-center">✓</span>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Inbox</label>
                        </div>
                        <select
                          value={config.chatwoot_inbox_id}
                          onChange={(e) => setConfig({...config, chatwoot_inbox_id: e.target.value})}
                          className="w-full bg-slate-50 border border-emerald-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-emerald-400/60 transition-all"
                        >
                          {inboxes.map(ib => (
                            <option key={ib.id} value={ib.id}>{ib.name}</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-slate-400 px-1">{inboxes.length} inbox(es) found — pick the WhatsApp one</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button type="submit" disabled={saving}
                    className="h-10 px-6 bg-brand-gold hover:bg-brand-gold/90 text-white rounded-xl shadow-lg shadow-brand-gold/10 font-black uppercase text-[9px] tracking-widest"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded-lg"><LinkIcon className="w-4 h-4 text-blue-500" /></div>
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-tight">Webhook URLs</CardTitle>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Paste these in provider</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    MSG91 Inbound <span className="text-emerald-500">● Input</span>
                  </label>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mb-1">Paste in MSG91 Dashboard → WhatsApp → Webhook</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono text-[11px] text-slate-600 truncate">{originUrl}/api/msg91-webhook</div>
                    <button onClick={() => copyToClipboard(`${originUrl}/api/msg91-webhook`, 'msg91')}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      {copiedMsg ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    Chatwoot Outbound <span className="text-blue-500">● Output</span>
                  </label>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mb-1">Paste in Chatwoot Dashboard → Inbox Settings → Webhook</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono text-[11px] text-slate-600 truncate">{originUrl}/api/chatwoot-webhook</div>
                    <button onClick={() => copyToClipboard(`${originUrl}/api/chatwoot-webhook`, 'chatwoot')}
                      className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      {copiedChat ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center">
                    {currentPlan === 'enterprise_monthly' ? <Shield className="w-6 h-6 text-brand-gold" />
                     : currentPlan === 'pro_monthly' ? <Rocket className="w-6 h-6 text-brand-gold" />
                     : <Clock className="w-6 h-6 text-brand-gold" />}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Plan</p>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{planDetails.name}</h2>
                    <p className="text-[12px] text-slate-500 font-bold mt-0.5">₹{planDetails.price}/mo • {(adminData?.messageCount || 0).toLocaleString()}/{planDetails.messageLimit.toLocaleString()} used</p>
                  </div>
                </div>
                <Button className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 font-black uppercase text-[9px] tracking-widest flex items-center gap-2">
                  Upgrade Plan <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>

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

      {activeTab === 'bridge' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-md font-black text-slate-900 uppercase tracking-tight mb-1">Bridge Mode</h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                    When Bridge Mode is ON, messages are forwarded to Chatwoot instead of AI inbox.
                  </p>
                  
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 mb-8">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-800">
                      <strong>Note:</strong> Bridge mode and AI inbox can now run simultaneously if both are enabled.
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Bridge Mode (Chatwoot)</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          Forward all WhatsApp messages to Chatwoot
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Basic MSG91 check for both
                          if (!config.msg91_authkey || !config.msg91_integrated_number) {
                            toast.error('Please fill MSG91 details first!');
                            return;
                          }

                          if (!config.bridgeEnabled) {
                            const isConfigured = config.chatwoot_api_token && 
                                               config.chatwoot_account_id && 
                                               config.chatwoot_inbox_id && 
                                               config.chatwoot_base_url;
                            
                            if (!isConfigured) {
                              toast.error('Please fill all Chatwoot details first!');
                              return;
                            }
                          }
                          setConfig({ ...config, bridgeEnabled: !config.bridgeEnabled });
                        }}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          config.bridgeEnabled ? "bg-blue-500" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            config.bridgeEnabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Platform Mode (AI Inbox)</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          Use internal chat workspace with AI replies
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!config.platformEnabled) {
                            if (!config.msg91_authkey || !config.msg91_integrated_number) {
                              toast.error('Please fill MSG91 details first!');
                              return;
                            }
                          }
                          setConfig({ ...config, platformEnabled: !config.platformEnabled });
                        }}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          config.platformEnabled ? "bg-emerald-500" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            config.platformEnabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {!config.bridgeEnabled && !config.platformEnabled && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] text-red-800 font-bold uppercase tracking-tight">
                          Warning: Both modes are OFF. No messages will be processed.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <MSG91SecurityGuide 
        isOpen={showSecurityGuide} 
        onClose={() => setShowSecurityGuide(false)}
        errorType={securityGuideType}
      />

      <GmailSecurityGuide 
        isOpen={showGmailGuide} 
        onClose={() => setShowGmailGuide(false)}
      />

      {/* Flow Guide Slide-in */}
      {showFlowGuide && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFlowGuide(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 p-8 overflow-y-auto">
            <button onClick={() => setShowFlowGuide(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <SettingsIcon className="w-5 h-5 text-slate-400 rotate-45" />
            </button>

            <div className="mt-8 space-y-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Integration Flow</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Copy-Paste Guide</p>
              </div>

              <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                {/* Step 1 */}
                <div className="relative flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-gold/20 z-10">1</div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">MSG91 Dashboard</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">Copy <span className="text-brand-gold">Auth Key</span></p>
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-500 italic">
                      Paste this in SaaS Settings → MSG91 Section
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-gold/20 z-10">2</div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SaaS Dashboard</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">Copy <span className="text-emerald-500">Inbound URL</span></p>
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-500 italic">
                      Paste this in MSG91 Dashboard → WhatsApp → Webhook
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-500/20 z-10">3</div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chatwoot Dashboard</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">Copy <span className="text-blue-500">API Token</span></p>
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-500 italic">
                      Paste this in SaaS Settings → Chatwoot Section
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-500/20 z-10">4</div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SaaS Dashboard</h4>
                    <p className="text-sm font-bold text-slate-900 mt-1">Copy <span className="text-blue-500">Outbound URL</span></p>
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-500 italic">
                      Paste this in Chatwoot Dashboard → Inbox Settings → Webhook
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                  <strong>TIP:</strong> Use <u>ngrok</u> or a public domain if you are testing on localhost, otherwise webhooks won't reach your server!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
