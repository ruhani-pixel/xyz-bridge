'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bot, Key, Cpu, Zap, Settings2, Sliders, Sparkles, Loader2, Save, MessageSquare, Send, BarChart3, PieChart, History, TrendingUp, RefreshCcw, Wallet, Phone, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function AIConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [stats, setStats] = useState({
    last1h: 0,
    today: 0,
    last7: 0,
    last30: 0,
    allTime: 0,
    lastSynced: null,
    tokens: { total: 0, today: 0 },
    pricing: {} as any,
    breakdown: {
      inputCostToday: 0,
      outputCostToday: 0,
      inputTokensToday: 0,
      outputTokensToday: 0,
      totalInput: 0,
      totalOutput: 0
    }
  });

  // Playground State
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [testingAi, setTestingAi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState({
    ai_provider: 'openai' as 'openai' | 'google',
    ai_api_key: '',
    ai_model: 'gpt-4o',
    ai_system_prompt: '',
    ai_temperature: 0.7,
    ai_max_tokens: 1000,
    ai_spend_limit: 10.0, // Default $10 limit
    ai_default_enabled: true,
    ai_source_mode: 'saas_ai' as 'own_api' | 'saas_ai',
    ai_own_enabled: false,
    ai_saas_enabled: true,
    saas_free_replies_used: 0,
    saas_free_replies_limit: 10,
    saas_wallet_balance_inr: 0,
    saas_wallet_currency: 'INR' as 'INR',
    saas_block_reason: null as string | null,
  });

  const [payuModalOpen, setPayuModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(99);
  const [customRechargeAmount, setCustomRechargeAmount] = useState<string>('');

  // Scroll to bottom of test chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages, testingAi]);

  useEffect(() => {
    async function loadConfig() {
      if (!user) return;
      try {
        const res = await fetch(`/api/user/update-ai-config?uid=${user.uid}`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();

        setConfig(prev => ({
          ...prev,
          ai_provider: data.ai_provider || 'openai',
          ai_api_key: data.ai_api_key || '',
          ai_model: data.ai_model || (data.ai_provider === 'google' ? 'gemini-2.0-flash' : 'gpt-4o'),
          ai_system_prompt: data.ai_system_prompt || 'You are a CEO of a modern tech agency. Your tone is bold and direct. Focus on helping clients with effective solutions. You represent the brand "Solid Models".',
          ai_temperature: data.ai_temperature || 0.7,
          ai_max_tokens: data.ai_max_tokens || 1000,
          ai_spend_limit: data.ai_spend_limit || 10.0,
          ai_default_enabled: data.ai_default_enabled ?? true,
          ai_source_mode: data.ai_source_mode || 'saas_ai',
          ai_own_enabled: data.ai_own_enabled ?? !!data.ai_api_key,
          ai_saas_enabled: data.ai_saas_enabled ?? true,
          saas_free_replies_used: data.saas_free_replies_used || 0,
          saas_free_replies_limit: data.saas_free_replies_limit || 10,
          saas_wallet_balance_inr: data.saas_wallet_balance_inr || 0,
          saas_wallet_currency: data.saas_wallet_currency || 'INR',
          saas_block_reason: data.saas_block_reason || null,
        }));
      } catch (error) {
        console.error('Config load failed:', error);
      } finally {
        setFetching(false);
      }
    }
    loadConfig();
    fetchStats();
  }, [user]);

  async function fetchStats() {
    if (!user) return;
    try {
      const res = await fetch('/api/user/billing-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/update-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, ...config })
      });
      if (!res.ok) throw new Error('Failed to update config');
      toast.success('AI Brain updated successfully! 🧠');
    } catch (error) {
      toast.error('Galti ho gayi... AI settings save nahi hui.');
    } finally {
      setLoading(false);
    }
  };

  const applyQuickRecharge = (amount: number) => {
    setRechargeAmount(amount);
    setCustomRechargeAmount('');
  };

  const applyCustomRecharge = () => {
    const parsed = Number(customRechargeAmount);
    if (!parsed || parsed < 99) {
      toast.error('Minimum recharge ₹99 hai.');
      return;
    }
    setRechargeAmount(parsed);
  };

  const openPayUComingSoon = async () => {
    if (!user) return;
    if (!rechargeAmount || rechargeAmount < 99) {
      toast.error('Recharge amount minimum ₹99 hona chahiye.');
      return;
    }

    try {
      await fetch('/api/user/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: rechargeAmount, gateway: 'payu' }),
      });
    } catch { }

    setPayuModalOpen(true);
  };

  const handleSyncPrices = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch('/api/user/sync-pricing', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      toast.success(data.message || 'Prices updated! 🚀');
      fetchStats(); // Refresh UI with new prices
    } catch (e) {
      toast.error('Sync failed. Try again later.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !testInput.trim()) return;

    // Allow request even if config.ai_api_key is empty to support backend .env fallback

    const newMessage = { role: 'user' as const, content: testInput };
    setTestMessages(prev => [...prev, newMessage]);
    setTestInput('');
    setTestingAi(true);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          provider: config.ai_provider,
          apiKey: config.ai_api_key,
          model: config.ai_model,
          systemPrompt: config.ai_system_prompt,
          temperature: config.ai_temperature,
          maxTokens: config.ai_max_tokens,
          messages: testMessages,
          input: newMessage.content
        })
      });

      // Refresh stats after a small delay to allow Firestore to update
      setTimeout(fetchStats, 2000);

      const data = await res.json();
      if (!res.ok || data.ok === false || data.error) throw new Error(data.error || 'API Request Failed');

      setTestMessages(prev => [...prev, { role: 'ai', content: data.text }]);
    } catch (error: any) {
      setTestMessages(prev => [...prev, { role: 'ai', content: `[ERROR] ${error.message}` }]);
    } finally {
      setTestingAi(false);
    }
  };

  if (fetching) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-gold animate-spin" /></div>;

  return (
    <div className="max-w-[1400px] h-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col">

      <div className="flex items-center justify-between shrink-0 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">AI Settings & Testing</h1>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest mt-1">Configure your LLM Brain & Personas</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={loading}
            className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-brand-gold/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: ALL Settings */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 pb-8 custom-scrollbar">

          {/* NEW: Billing & Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 shrink-0">
            {[
              { label: 'Last 1 Hour', value: stats.last1h, icon: History, color: 'text-amber-500', bg: 'bg-amber-50', sub: 'Est.' },
              { label: 'Today', value: stats.today, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', sub: `${stats.breakdown.inputTokensToday + stats.breakdown.outputTokensToday} tokens` },
              { label: 'Last 7 Days', value: stats.last7, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50', sub: 'Weekly' },
              { label: 'Last 30 Days', value: stats.last30, icon: PieChart, color: 'text-indigo-500', bg: 'bg-indigo-50', sub: 'Monthly' },
              { label: 'Cumulative', value: stats.allTime, icon: Zap, color: 'text-brand-gold', bg: 'bg-brand-gold/10', sub: 'All-Time' },
            ].map((item, idx) => (
              <Card key={idx} className="p-4 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className={cn("absolute -right-2 -top-2 w-12 h-12 rounded-full opacity-10 transition-transform group-hover:scale-125", item.bg)} />
                <div className="flex flex-col gap-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("w-3 h-3", item.color)} />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    ${item.value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.sub}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
            <Card className="p-4 border-slate-100 bg-white rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  {config.ai_provider === 'google' ? <Zap className="w-4 h-4 text-blue-500" /> : <Sparkles className="w-4 h-4 text-emerald-500" />}
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pricing Plan ({config.ai_model})</p>
                  <p className="text-[10px] font-bold text-slate-700">
                    In: ${stats.pricing?.[config.ai_model.replace('models/', '')]?.prompt || '0.00'}/1M •
                    Out: ${stats.pricing?.[config.ai_model.replace('models/', '')]?.completion || '0.00'}/1M
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Market Sync Status</p>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={handleSyncPrices}
                  disabled={syncLoading}
                  className="h-7 px-3 text-[8px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand-gold/20 hover:scale-105 transition-all flex items-center gap-2 rounded-xl"
                >
                  {syncLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                  {stats.lastSynced ? `Synced: ${new Date(stats.lastSynced).toLocaleDateString()}` : 'Sync Market Rates'}
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-slate-100 bg-slate-900 rounded-3xl shadow-sm flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-gold" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Intelligence</p>
                  <p className="text-[10px] font-black text-brand-gold uppercase">{config.ai_provider} Engine Online</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Lifecycle Usage</p>
                <p className="text-[10px] font-black text-slate-300">{stats.breakdown.totalInput + stats.breakdown.totalOutput} tokens</p>
              </div>
            </Card>
          </div>

          <Card className="border-slate-100 shadow-xl rounded-[2rem] shrink-0 overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-gold" /> Intelligence Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-5">

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'openai', name: 'OpenAI (GPT)', icon: Sparkles, color: 'zinc-900' },
                  { id: 'google', name: 'Google (Gemini)', icon: Zap, color: 'blue-600' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setConfig({
                      ...config,
                      ai_provider: p.id as any,
                      ai_model: p.id === 'openai' ? 'gpt-4o' : 'gemini-2.0-flash'
                    })}
                    className={cn(
                      "p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 group",
                      config.ai_provider === p.id
                        ? "border-brand-gold bg-brand-gold/5 shadow-lg"
                        : "border-slate-50 hover:border-slate-200 bg-slate-50/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                      p.id === 'openai' ? "bg-zinc-800" : "bg-blue-600"
                    )}>
                      <p.icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      config.ai_provider === p.id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
                    )}>{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">API Private Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="sk-••••••••••••••••••••••••"
                      className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl font-mono text-xs"
                      value={config.ai_api_key}
                      onChange={(e) => setConfig({ ...config, ai_api_key: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end pr-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Personality / Instructions</label>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-tight",
                      (config.ai_system_prompt?.length || 0) > 400 ? "text-rose-500" : "text-slate-300"
                    )}>
                      {config.ai_system_prompt?.length || 0} / 500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. You are a CEO of a modern tech agency..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[18px] p-4 text-sm font-medium focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/30 outline-none transition-all resize-none"
                    value={config.ai_system_prompt}
                    onChange={(e) => setConfig({ ...config, ai_system_prompt: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-xl rounded-[2rem] shrink-0 overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-brand-gold" /> AI Source Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setConfig({ ...config, ai_source_mode: 'own_api', ai_own_enabled: true })}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all',
                    config.ai_source_mode === 'own_api' ? 'border-brand-gold bg-brand-gold/5' : 'border-slate-100 bg-slate-50/50'
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Use My API</p>
                  <p className="text-[10px] text-slate-500 mt-1">Aapki personal key use hogi</p>
                </button>
                <button
                  onClick={() => setConfig({ ...config, ai_source_mode: 'saas_ai', ai_saas_enabled: true })}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all',
                    config.ai_source_mode === 'saas_ai' ? 'border-brand-gold bg-brand-gold/5' : 'border-slate-100 bg-slate-50/50'
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Use Solid Models SaaS AI</p>
                  <p className="text-[10px] text-slate-500 mt-1">Env key + wallet billing</p>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Active Source</p>
                  <p className="text-xs font-black text-slate-900 mt-1">{config.ai_source_mode === 'own_api' ? 'Own API' : 'SaaS AI'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Free Replies</p>
                  <p className="text-xs font-black text-slate-900 mt-1">{config.saas_free_replies_used} / {config.saas_free_replies_limit}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Wallet Balance</p>
                  <p className="text-xs font-black text-slate-900 mt-1">₹{Number(config.saas_wallet_balance_inr || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Grid Below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            <Card className="border-slate-200 shadow-xl rounded-[2rem] bg-white text-slate-900 overflow-hidden shrink-0">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-3 h-3 text-brand-gold" /> Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temperature</label>
                    <span className="text-brand-gold font-black text-xs">{config.ai_temperature}</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                    value={config.ai_temperature}
                    onChange={(e) => setConfig({ ...config, ai_temperature: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model</label>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {config.ai_model.includes('lite') || config.ai_model === 'gemini-1.5-flash' ? '$0.075 / 1M' :
                        config.ai_model.includes('2.') || config.ai_model === 'gemini-flash-latest' ? '$0.10 / 1M' :
                          config.ai_model.includes('gpt-4o-mini') ? '$0.15 / 1M' :
                            config.ai_model.includes('pro') ? '$3.50 / 1M' :
                              config.ai_model === 'gpt-4o' ? '$5.00 / 1M' :
                                config.ai_model === 'gpt-4-turbo' ? '$10.00 / 1M' : ''}
                    </span>
                  </div>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-xl h-10 px-4 text-xs font-black uppercase tracking-widest focus:ring-1 focus:ring-brand-gold transition-all cursor-pointer"
                    value={config.ai_model}
                    onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                  >
                    {config.ai_provider === 'openai' ? (
                      <>
                        <option value="gpt-4o">GPT-4o (Omni)</option>
                        <option value="gpt-4o-mini">GPT-4o-Mini</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </>
                    ) : (
                      <>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                      </>
                    )}
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="p-5 bg-brand-gold/5 rounded-[2rem] border border-brand-gold/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-gold" />
                  <h4 className="text-[10px] font-black text-slate-900 uppercase">Max Reply Length</h4>
                </div>
                <span className="text-[8px] font-bold text-slate-400">Tokens</span>
              </div>
              <Input
                type="number"
                max="4096"
                className="h-10 bg-white rounded-xl text-xs font-black"
                value={config.ai_max_tokens}
                onChange={(e) => setConfig({ ...config, ai_max_tokens: parseInt(e.target.value) })}
              />
              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">Controls the length of a single AI response.</p>
            </div>

            <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-3 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Hard Spend Limit (USD)</h4>
                </div>
              </div>
              <Input
                type="number"
                step="0.1"
                className="h-10 bg-white rounded-xl text-xs font-black"
                value={config.ai_spend_limit}
                onChange={(e) => setConfig({ ...config, ai_spend_limit: parseFloat(e.target.value) })}
              />
              <p className="text-[7px] text-emerald-600/60 font-medium uppercase tracking-tighter">Bot pauses execution once lifecycle cost hits this limit.</p>
            </div>
          </div>

          <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Add Money (SaaS AI Wallet)</h4>
              </div>
              <p className="text-[9px] font-bold text-emerald-700">Minimum ₹99</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => applyQuickRecharge(99)} className="h-9 px-4 text-[10px] font-black uppercase">₹99</Button>
              <Button type="button" variant="secondary" onClick={() => applyQuickRecharge(299)} className="h-9 px-4 text-[10px] font-black uppercase">₹299</Button>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                min={99}
                placeholder="Custom amount e.g. 766"
                value={customRechargeAmount}
                onChange={(e) => setCustomRechargeAmount(e.target.value)}
                className="h-10 bg-white rounded-xl text-xs font-black"
              />
              <Button type="button" variant="secondary" onClick={applyCustomRecharge} className="h-10 px-4 text-[10px] font-black uppercase">Apply</Button>
            </div>

            <div className="flex items-center justify-between bg-white border border-emerald-100 rounded-xl px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected Amount</p>
              <p className="text-sm font-black text-slate-900">₹{rechargeAmount}</p>
            </div>

            <Button type="button" variant="brand" onClick={openPayUComingSoon} className="h-11 w-full text-[10px] font-black uppercase tracking-widest">
              Proceed with PayU
            </Button>
          </div>
        </div>

        {/* Right Column: Embedded Simulator */}
        <div className="lg:col-span-4 h-full hidden lg:flex flex-col bg-white border border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Simulator Window</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{config.ai_model}</p>
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
            {testMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                <MessageSquare className="w-10 h-10 text-slate-300" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sandbox Embedded<br /><span className="font-medium lowercase normal-case text-xs">Test changes instantly!</span></p>
              </div>
            ) : (
              testMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "px-6 py-4 rounded-3xl text-[13px] leading-relaxed shadow-sm",
                    msg.role === 'user'
                      ? "bg-slate-900 text-white rounded-br-none"
                      : "bg-white border border-slate-100 text-slate-700 rounded-bl-none",
                  )}>
                    <MarkdownText content={msg.content} />
                  </div>
                </div>
              ))
            )}
            {testingAi && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-4 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={handleTestSubmit} className="relative">
              <input
                type="text"
                placeholder="Test your custom persona..."
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                className="w-full h-12 pl-4 pr-12 bg-slate-50 border border-slate-100 focus:border-brand-gold/30 rounded-2xl text-xs font-medium focus:outline-none transition-all"
                disabled={testingAi}
              />
              <button
                type="submit"
                disabled={!testInput.trim() || testingAi}
                className="absolute right-1 top-1 bottom-1 w-10 bg-brand-gold text-white rounded-[10px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-gold/90 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {payuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">PayU Popup</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Coming Soon feature 🚧<br />
              Tab tak aap apni API key use kar sakte ho ya hume call/WhatsApp kar sakte ho.
            </p>
            <p className="text-xs font-black text-slate-900">Support: 8302806913</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a href="tel:8302806913" className="h-10 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <Phone className="w-3 h-3" /> Call
              </a>
              <a href="https://wa.me/918302806913" target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </a>
            </div>
            <Button type="button" variant="secondary" onClick={() => setPayuModalOpen(false)} className="h-10 w-full text-[10px] font-black uppercase tracking-widest">
              Close
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
