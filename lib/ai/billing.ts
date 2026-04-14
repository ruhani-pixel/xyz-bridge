import { adminDb } from '../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Hardcoded Fallback Prices (USD per 1 Million Tokens)
// These are used if Firestore pricing is not found.
const DEFAULT_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gemini-2.0-flash': { prompt: 0.10, completion: 0.40 },
  'gemini-2.0-flash-lite': { prompt: 0.075, completion: 0.30 },
  'gemini-2.5-flash': { prompt: 0.10, completion: 0.40 },
  'gemini-2.5-pro': { prompt: 1.25, completion: 5.00 },
  'gemini-1.5-flash': { prompt: 0.10, completion: 0.40 },
  'gpt-4o': { prompt: 5.00, completion: 15.00 },
  'gpt-4o-mini': { prompt: 0.15, completion: 0.60 },
  'gpt-4-turbo': { prompt: 10.00, completion: 30.00 },
};

async function getPricing() {
  try {
    const configDoc = await adminDb.collection('system').doc('config').get();
    if (configDoc.exists && configDoc.data()?.ai_pricing) {
      return configDoc.data()?.ai_pricing;
    }
    // Auto-initialize if it doesn't exist
    await adminDb.collection('system').doc('config').set({ ai_pricing: DEFAULT_PRICING }, { merge: true });
    return DEFAULT_PRICING;
  } catch (e) {
    console.warn('Could not fetch pricing from Firestore, using defaults:', e);
    return DEFAULT_PRICING;
  }
}

export async function trackUsage(
  uid: string, 
  provider: string, 
  model: string, 
  inputTokens: number, 
  outputTokens: number,
  thinkingTokens: number = 0
) {
  try {
    if (!uid) return;

    const pricing = await getPricing();
    const cleanModel = model.replace('models/', '');
    const priceSet = pricing[cleanModel] || DEFAULT_PRICING[cleanModel] || DEFAULT_PRICING['gemini-2.0-flash'];
    
    const effectiveOutputTokens = outputTokens + thinkingTokens;
    const inputCost = (inputTokens / 1_000_000) * priceSet.prompt;
    const outputCost = (effectiveOutputTokens / 1_000_000) * priceSet.completion;
    const totalCost = inputCost + outputCost;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hourKey = `h${now.getHours()}`;

    const statsRef = adminDb.collection('users').doc(uid).collection('ai_stats');
    const batch = adminDb.batch();

    // 1. All-Time Totals
    const totalDoc = statsRef.doc('all_time');
    batch.set(totalDoc, {
      totalInput: FieldValue.increment(inputTokens),
      totalOutput: FieldValue.increment(effectiveOutputTokens),
      totalCost: FieldValue.increment(totalCost),
      inputCostTotal: FieldValue.increment(inputCost),
      outputCostTotal: FieldValue.increment(outputCost),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Daily Doc
    const dailyDoc = statsRef.doc(`daily_${dateStr}`);
    batch.set(dailyDoc, {
      date: dateStr,
      input: FieldValue.increment(inputTokens),
      output: FieldValue.increment(effectiveOutputTokens),
      cost: FieldValue.increment(totalCost),
      inputCost: FieldValue.increment(inputCost),
      outputCost: FieldValue.increment(outputCost),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Hourly Buckets
    const hourlyDoc = statsRef.doc(`hourly_${dateStr}`);
    batch.set(hourlyDoc, {
      date: dateStr,
      [hourKey]: FieldValue.increment(totalCost),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();
    return { totalCost, inputCost, outputCost };
  } catch (error) {
    console.error('Error tracking usage:', error);
    return null;
  }
}
