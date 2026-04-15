import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'viewer' | 'agent' | 'admin' | 'superadmin';

export interface AdminUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  role: UserRole;
  isApproved: boolean;

  // Hierarchy & Team
  tenantId?: string;     // Group users under a company head
  invitedBy?: string;    // Track who invited this user
  globalAiEnabled?: boolean; // Master AI Switch for the whole tenant

  // Subscription & SAAS
  planId?: 'free_trial' | 'pro_monthly' | 'enterprise_monthly';
  planStatus?: 'active' | 'expired' | 'past_due' | 'canceled';
  trialExpiresAt?: Timestamp | Date | any;
  subscriptionExpiresAt?: Timestamp | Date | any;
  messageCount?: number;
  messageLimit?: number;

  // Onboarding & Company Profile
  onboardingComplete?: boolean;
  companyName?: string;
  industry?: string;
  teamSize?: string;
  accountType?: 'bridge' | 'platform';

  // MSG91 Config
  msg91_authkey?: string;
  msg91_integrated_number?: string;

  // Chatwoot Config (Bridge Mode)
  chatwoot_base_url?: string;
  chatwoot_api_token?: string;
  chatwoot_account_id?: string;
  chatwoot_inbox_id?: string;

  // AI Config (Platform Mode)
  ai_provider?: 'openai' | 'google';
  ai_api_key?: string;
  ai_model?: string;
  ai_system_prompt?: string;
  ai_default_enabled?: boolean;
  ai_max_tokens?: number;
  ai_temperature?: number;
  ai_source_mode?: 'own_api' | 'saas_ai';
  ai_own_enabled?: boolean;
  ai_saas_enabled?: boolean;
  saas_free_replies_used?: number;
  saas_free_replies_limit?: number;
  saas_wallet_balance_inr?: number;
  saas_wallet_currency?: 'INR';
  saas_last_charge_at?: Timestamp | Date | any;
  saas_block_reason?: string | null;

  createdAt: Timestamp | Date | any;
  lastLoginAt: Timestamp | Date | any;
}
