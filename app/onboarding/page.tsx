'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { 
  Building2, Users, ArrowRight, Check, Rocket, Shield, Clock, 
  MessageSquare, Globe
} from 'lucide-react';

const INDUSTRIES = [
  'Real Estate', 'E-Commerce', 'Education', 
  'Healthcare', 'Retail', 'Other'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, onboardingComplete, role } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free_trial');

  // If already onboarded or is an agent, redirect to dashboard
  useEffect(() => {
    if (!loading) {
      if (onboardingComplete || role === 'agent') {
        router.push('/dashboard');
      }
    }
  }, [loading, onboardingComplete, role, router]);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const plan = selectedPlan === 'pro_monthly' ? PLANS.PRO_MONTHLY 
                 : selectedPlan === 'enterprise_monthly' ? PLANS.ENTERPRISE_MONTHLY 
                 : PLANS.FREE_TRIAL;

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 15);

      await updateDoc(doc(db, 'users', user.uid), {
        companyName: companyName || 'My Workspace',
        industry: industry || 'Other',
        planId: selectedPlan,
        planStatus: 'active',
        messageLimit: plan.messageLimit,
        messageCount: 0,
        accountType: 'platform',
        onboardingComplete: true,
        trialExpiresAt: selectedPlan === 'free_trial' ? trialEnd : null,
        updatedAt: serverTimestamp(),
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center py-12 px-4 selection:bg-indigo-100">
      
      {/* Top Progress Indicator */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1.5 shadow-sm">
            <img src="/logopro.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Solid Models</span>
        </div>
        
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <span className={cn(step >= 1 ? "text-indigo-600" : "")}>Workspace</span>
          <span className={cn(step >= 2 ? "text-indigo-600" : "")}>Subscription</span>
          <span className={cn(step >= 3 ? "text-indigo-600" : "")}>Launch</span>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="p-8 sm:p-10 relative z-10 transition-all duration-500">
          
          {/* STEP 1: Company Info */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div>
                <h2 className="text-2xl font-medium tracking-tight text-slate-900">Create your workspace</h2>
                <p className="text-sm text-slate-500 mt-1 font-light">Tell us a bit about your business to get started.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Industry</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={cn(
                          "px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-center",
                          industry === ind
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!companyName}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Plan Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div>
                <h2 className="text-2xl font-medium tracking-tight text-slate-900">Choose a plan</h2>
                <p className="text-sm text-slate-500 mt-1 font-light">Select the plan that fits your needs. You can change this later.</p>
              </div>

              <div className="space-y-3">
                <PlanCard 
                  plan={PLANS.FREE_TRIAL}
                  selected={selectedPlan === 'free_trial'}
                  onSelect={() => setSelectedPlan('free_trial')}
                  icon={<Clock className="w-5 h-5 text-slate-500" />}
                  badge="15 Days Free"
                />

                <PlanCard 
                  plan={PLANS.PRO_MONTHLY}
                  selected={selectedPlan === 'pro_monthly'}
                  onSelect={() => setSelectedPlan('pro_monthly')}
                  icon={<Rocket className="w-5 h-5 text-indigo-600" />}
                  highlighted
                />

                <PlanCard 
                  plan={PLANS.ENTERPRISE_MONTHLY}
                  selected={selectedPlan === 'enterprise_monthly'}
                  onSelect={() => setSelectedPlan('enterprise_monthly')}
                  icon={<Shield className="w-5 h-5 text-slate-500" />}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-slate-500 hover:bg-slate-50 font-medium text-sm rounded-xl transition-colors"
                >
                  Back
                </button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Ready to Go */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8 text-center pt-4">
              <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center ring-8 ring-indigo-50/50 mb-6">
                <Check className="w-10 h-10 text-indigo-600" />
              </div>

              <div>
                <h2 className="text-2xl font-medium tracking-tight text-slate-900">Setup complete</h2>
                <p className="text-sm text-slate-500 mt-2 font-light max-w-sm mx-auto">
                  {companyName || 'Your workspace'} is ready. Connect your numbers and invite your team.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Inbox</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Globe className="w-5 h-5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Widget</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Team</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Go to Dashboard'
                  )}
                </Button>
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, selected, onSelect, icon, highlighted, badge }: any) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer relative",
        selected && highlighted
          ? "bg-indigo-50/50 border-indigo-500 shadow-sm"
          : selected
          ? "bg-white border-slate-900 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          selected && highlighted ? "bg-indigo-100" : "bg-slate-100"
        )}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {plan.price > 0 ? `₹${plan.price}/mo` : 'Free forever'}
          </p>
        </div>

        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
          selected && highlighted
            ? "border-indigo-500 bg-indigo-500"
            : selected
            ? "border-slate-900 bg-slate-900" 
            : "border-slate-300 bg-white"
        )}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
    </div>
  );
}
