export const PLANS = {
  FREE_TRIAL: {
    id: 'free_trial',
    name: 'Starter',
    price: 0,
    durationDays: 15,
    messageLimit: 100,
    teamLimit: 1,
    features: [
      'AI Auto-Reply',
      '100 Messages',
      'WhatsApp Inbox',
      'Website Widget (Watermark)',
    ],
  },
  PRO_MONTHLY: {
    id: 'pro_monthly',
    name: 'Pro',
    price: 799,
    messageLimit: 5000,
    teamLimit: 5,
    features: [
      'AI + Bridge Mode',
      '5,000 Messages',
      'Up to 5 Team Members',
      'Custom AI Persona',
      'Website Widget',
      'Priority Support',
    ],
    isPopular: true,
  },
  ENTERPRISE_MONTHLY: {
    id: 'enterprise_monthly',
    name: 'Enterprise',
    price: 2399,
    messageLimit: 999999,
    teamLimit: 999,
    features: [
      'Unlimited Messages',
      'Unlimited Team',
      'GPT-4o / Gemini Pro',
      'Custom Branding',
      'API Access',
      'Dedicated SLA',
    ],
  }
};

export type PlanId = keyof typeof PLANS;
