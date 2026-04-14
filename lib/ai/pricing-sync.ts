import { adminDb } from '../firebase/admin';

const LITELLM_PRICING_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

// Supported Models Map (LiteLLM Key -> Our Key)
const SUPPORTED_MODELS = {
  // Google
  'gemini/gemini-1.5-flash': 'gemini-1.5-flash',
  'gemini/gemini-2.0-flash-exp': 'gemini-2.0-flash', // Fallback for 2.0
  'gemini/gemini-2.0-flash-lite-preview-02-05': 'gemini-2.0-flash-lite',
  'gemini/gemini-2.5-flash-preview': 'gemini-2.5-flash',
  'gemini/gemini-2.5-pro-preview': 'gemini-2.5-pro',
  
  // OpenAI
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
};

export async function syncPricingFromLiteLLM() {
  try {
    const response = await fetch(LITELLM_PRICING_URL);
    if (!response.ok) throw new Error('Failed to fetch LiteLLM pricing');
    
    const data = await response.json();
    const newPricing: Record<string, { prompt: number; completion: number }> = {};

    // Map LiteLLM rates to our format ($ per 1M tokens)
    Object.entries(SUPPORTED_MODELS).forEach(([liteKey, ourKey]) => {
      const modelData = data[liteKey];
      if (modelData) {
        newPricing[ourKey] = {
          // LiteLLM stores price per token (e.g. 1e-07). Multiply by 1M for UI.
          prompt: (modelData.input_cost_per_token || 0) * 1_000_000,
          completion: (modelData.output_cost_per_token || 0) * 1_000_000
        };
      }
    });

    // Ensure we don't have zeros for critical models due to mapping changes
    if (!newPricing['gemini-2.0-flash'] && data['gemini/gemini-2.0-flash']) {
        newPricing['gemini-2.0-flash'] = {
            prompt: (data['gemini/gemini-2.0-flash'].input_cost_per_token || 0) * 1_000_000,
            completion: (data['gemini/gemini-2.0-flash'].output_cost_per_token || 0) * 1_000_000
        };
    }

    // Save to Firestore
    await adminDb.collection('system').doc('config').set({
      ai_pricing: newPricing,
      lastSynced: new Date().toISOString()
    }, { merge: true });

    console.log('Successfully synced AI pricing from LiteLLM');
    return { success: true, pricing: newPricing };
  } catch (error) {
    console.error('Error syncing pricing:', error);
    return { success: false, error: (error as Error).message };
  }
}
