'use client';

import { Check, Zap, Shield, Rocket, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    // In a real app, this would redirect to checkout or update the user's trial
    router.push(`/onboarding/setup?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20 px-4">
      {/* FOMO Gradient Header */}
      <div className="max-w-4xl mx-auto text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.2em] mb-6">
          <Zap className="w-3 h-3 fill-brand-gold" />
          Limited Time: Launch Offer Active
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-none">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-500">Power</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
          Scale your WhatsApp AI engagement with Solid Models. From solo founders to global enterprises, we have the architecture to fuel your growth.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Plan 1: Free Trial */}
        <PricingCard 
          plan={PLANS.FREE_TRIAL}
          icon={<Clock className="w-6 h-6 text-slate-400" />}
          description="Perfect for testing the waters."
          onSelect={() => handleSelectPlan('free_trial')}
          buttonText="Start 15-Day Trial"
        />

        {/* Plan 2: Pro (The Decoy) */}
        <PricingCard 
          plan={PLANS.PRO_MONTHLY}
          icon={<Rocket className="w-6 h-6 text-brand-gold" />}
          description="Ideal for growing businesses."
          highlighted
          onSelect={() => handleSelectPlan('pro_monthly')}
          buttonText="Upgrade to Pro"
        />

        {/* Plan 3: Enterprise (The Target) */}
        <PricingCard 
          plan={PLANS.ENTERPRISE_MONTHLY}
          icon={<Shield className="w-6 h-6 text-emerald-400" />}
          description="Maximum power, unlimited scale."
          onSelect={() => handleSelectPlan('enterprise_monthly')}
          buttonText="Go Unlimited"
        />
      </div>

      {/* Trust & FOMO Footer */}
      <div className="max-w-4xl mx-auto mt-20 p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Trusted by Solid Models India</p>
         <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale contrast-125">
            {/* These would be logos */}
            <span className="text-lg font-black italic">TECHNO</span>
            <span className="text-lg font-black italic">GLOBAL</span>
            <span className="text-lg font-black italic">PRIME</span>
            <span className="text-lg font-black italic">ZENITH</span>
         </div>
      </div>
    </div>
  );
}

function PricingCard({ plan, icon, description, highlighted = false, onSelect, buttonText }: any) {
  return (
    <Card className={cn(
      "relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 overflow-hidden",
      highlighted 
        ? "bg-white border-brand-gold shadow-[0_0_80px_-15px_rgba(234,179,8,0.3)] scale-105 z-10 text-slate-900 border-2" 
        : "bg-slate-900/40 border-slate-800 text-white hover:border-slate-700"
    )}>
      {highlighted && (
        <div className="absolute top-0 right-0 px-6 py-2 bg-brand-gold text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
          highlighted ? "bg-slate-100" : "bg-slate-800"
        )}>
          {icon}
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{plan.name}</h3>
        <p className={cn("text-sm", highlighted ? "text-slate-500" : "text-slate-400")}>{description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">₹{plan.price}</span>
          <span className={cn("text-sm font-bold opacity-60", highlighted ? "text-slate-500" : "text-slate-400")}> /mo</span>
        </div>
      </div>

      <div className="space-y-4 mb-10 flex-1">
        {plan.features.map((feature: string) => (
          <div key={feature} className="flex items-center gap-3">
            <div className={cn(
               "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
               highlighted ? "bg-brand-gold/10 text-brand-gold" : "bg-slate-800 text-slate-400"
            )}>
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-sm font-bold uppercase tracking-tight opacity-80">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onSelect}
        className={cn(
          "w-full py-7 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all",
          highlighted 
            ? "bg-brand-gold hover:bg-slate-900 text-white shadow-brand-gold/20" 
            : "bg-white text-slate-950 hover:bg-brand-gold hover:text-white"
        )}
      >
        {buttonText}
      </Button>
    </Card>
  );
}
