'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Key, 
  Hash, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Settings2,
  Cpu,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'free_trial';
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    msg91_authkey: '',
    msg91_integrated_number: '',
    chatwoot_base_url: 'https://app.chatwoot.com',
    chatwoot_api_token: '',
    chatwoot_account_id: '',
    chatwoot_inbox_id: '',
    ai_provider: 'openai' as 'openai' | 'google',
    ai_api_key: '',
    ai_model: 'gpt-4o',
    ai_system_prompt: 'You are a professional assistant for Solid Models. Help customers concisely.',
    ai_default_enabled: true,
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push('/pricing');
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 15);

      await updateDoc(userRef, {
        ...formData,
        planId: planId,
        planStatus: 'active',
        trialExpiresAt: trialExpiry,
        messageCount: 0,
        messageLimit: planId === 'enterprise_monthly' ? 999999 : planId === 'pro_monthly' ? 1000 : 100,
        onboardingComplete: true,
        updatedAt: serverTimestamp()
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 px-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500",
              step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/30 ring-4 ring-brand-gold/10" : "bg-white border-2 border-slate-200 text-slate-300"
            )}>
              {step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn(
                "flex-1 h-1 mx-4 rounded-full transition-all duration-500",
                step > i + 1 ? "bg-emerald-500" : "bg-slate-200"
              )} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-slate-200 shadow-2xl p-8 rounded-3xl bg-white overflow-hidden">
        <div className="mb-8">
          <h2 className="text-sm font-black text-brand-gold uppercase tracking-[0.2em] mb-2">Step {step} of {totalSteps}</h2>
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {step === 1 ? 'Configure MSG91' : step === 2 ? 'AI Intelligence' : 'Bridge & Finalize'}
          </CardTitle>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {step === 1 ? 'Connect your MSG91 account for WhatsApp messaging.' : step === 2 ? 'Provide your AI API key to activate auto-replies.' : 'Optional: Link Chatwoot if you want to bridge messages.'}
          </p>
        </div>

        <CardContent className="p-0 space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">MSG91 Auth Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="Enter your MSG91 AuthKey" 
                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                    value={formData.msg91_authkey}
                    onChange={(e) => updateForm('msg91_authkey', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Integrated WhatsApp Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="e.g. 917316914XXX" 
                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                    value={formData.msg91_integrated_number}
                    onChange={(e) => updateForm('msg91_integrated_number', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => updateForm('ai_provider', 'openai')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex items-center gap-3",
                    formData.ai_provider === 'openai' ? "border-brand-gold bg-brand-gold/5 text-slate-900" : "border-slate-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white"><Cpu className="w-4 h-4" /></div>
                  <span className="font-black text-[10px] uppercase tracking-widest">OpenAI</span>
                </button>
                <button 
                  onClick={() => updateForm('ai_provider', 'google')}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex items-center gap-3",
                    formData.ai_provider === 'google' ? "border-brand-gold bg-brand-gold/5 text-slate-900" : "border-slate-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Zap className="w-4 h-4" /></div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Gemini</span>
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">API Secret Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder={`Enter your ${formData.ai_provider === 'openai' ? 'OpenAI' : 'Google'} API Key`} 
                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                    value={formData.ai_api_key}
                    onChange={(e) => updateForm('ai_api_key', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">System Personality / Prompt</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none min-h-[100px]"
                  placeholder="You are AI assistant for Solid Models..."
                  value={formData.ai_system_prompt}
                  onChange={(e) => updateForm('ai_system_prompt', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Step 3: Optional Enterprise Bridge
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">If you don't use Chatwoot, leave these fields blank and continue.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Chatwoot Base URL</label>
                <Input 
                  type="text" 
                  className="h-11 bg-slate-50 border-slate-200"
                  value={formData.chatwoot_base_url}
                  onChange={(e) => updateForm('chatwoot_base_url', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Account ID</label>
                  <Input 
                    type="text" 
                    className="h-11 bg-slate-50 border-slate-200"
                    value={formData.chatwoot_account_id}
                    onChange={(e) => updateForm('chatwoot_account_id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Inbox ID</label>
                  <Input 
                    type="text" 
                    className="h-11 bg-slate-50 border-slate-200"
                    value={formData.chatwoot_inbox_id}
                    onChange={(e) => updateForm('chatwoot_inbox_id', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">API Access Token</label>
                <div className="relative">
                  <Settings2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                    value={formData.chatwoot_api_token}
                    onChange={(e) => updateForm('chatwoot_api_token', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="mt-10 flex items-center justify-between">
           <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 gap-2"
           >
             <ArrowLeft className="w-4 h-4" /> Back
           </Button>

           <Button 
            variant="brand" 
            disabled={loading}
            onClick={handleNext}
            className="h-12 px-10 rounded-full font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-brand-gold/20"
           >
             {loading ? 'Securing Config...' : step === totalSteps ? 'Activate Dashboard' : 'Continue Integration'} 
             {step < totalSteps && <ArrowRight className="w-4 h-4" />}
           </Button>
        </div>
      </Card>
    </div>
  );
}
