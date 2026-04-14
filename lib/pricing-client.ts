// Client-safe pricing metadata for UI display
// Keep this in sync with lib/ai/billing.ts
export const PRICING_META: Record<string, { prompt: number; completion: number }> = {
  'gemini-2.0-flash': { prompt: 0.10, completion: 0.40 },
  'gemini-2.0-flash-lite': { prompt: 0.075, completion: 0.30 },
  'gemini-2.5-flash': { prompt: 0.10, completion: 0.40 },
  'gemini-2.5-pro': { prompt: 1.25, completion: 5.00 },
  'gemini-1.5-flash': { prompt: 0.10, completion: 0.40 },
  'gpt-4o': { prompt: 5.00, completion: 15.00 },
  'gpt-4o-mini': { prompt: 0.15, completion: 0.60 },
  'gpt-4-turbo': { prompt: 10.00, completion: 30.00 },
};
