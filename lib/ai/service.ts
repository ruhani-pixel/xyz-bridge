import { adminDb } from '../firebase/admin';
import { estimateUsageCostUSD, trackUsage } from './billing';

const DEFAULT_FREE_REPLIES_LIMIT = 10;
const DEFAULT_USD_INR_RATE = 84;
const DEFAULT_SAAS_MARKUP_MULTIPLIER = 1.35;
const DEFAULT_MIN_REPLY_CHARGE_INR = 0.1;

function toINRFromUSD(usd: number, usdInrRate: number, markup: number) {
  return usd * usdInrRate * markup;
}

async function getSaasCostConfig() {
  try {
    const configDoc = await adminDb.collection('system').doc('config').get();
    const data = configDoc.data() || {};
    return {
      usdInrRate: Number(data.usd_inr_rate) || DEFAULT_USD_INR_RATE,
      saasMarkupMultiplier: Number(data.saas_markup_multiplier) || DEFAULT_SAAS_MARKUP_MULTIPLIER,
      minReplyChargeInr: Number(data.saas_min_reply_charge_inr) || DEFAULT_MIN_REPLY_CHARGE_INR,
    };
  } catch {
    return {
      usdInrRate: DEFAULT_USD_INR_RATE,
      saasMarkupMultiplier: DEFAULT_SAAS_MARKUP_MULTIPLIER,
      minReplyChargeInr: DEFAULT_MIN_REPLY_CHARGE_INR,
    };
  }
}

function resolveSourceMode(userData: any) {
  const aiSourceMode = userData.ai_source_mode || 'saas_ai';
  const provider = userData.ai_provider || (process.env.GOOGLE_API_KEY ? 'google' : 'openai');
  const model = userData.ai_model || (provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-flash');

  if (aiSourceMode === 'own_api') {
    return {
      sourceMode: 'own_api' as const,
      provider,
      model,
      apiKey: userData.ai_api_key || '',
      billingMode: 'customer_key' as const,
    };
  }

  const saasApiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GOOGLE_API_KEY;
  return {
    sourceMode: 'saas_ai' as const,
    provider,
    model,
    apiKey: saasApiKey || '',
    billingMode: 'wallet' as const,
  };
}

export async function generateAIResponse(ownerId: string, contactPhone: string, userMessage: string) {
  try {
    // 1. Fetch User Config
    const userDoc = await adminDb.collection('users').doc(ownerId).get();
    if (!userDoc.exists) throw new Error('User not found');
    const userData = userDoc.data()!;

    const { sourceMode, provider, apiKey, model } = resolveSourceMode(userData);

    if (!apiKey) throw new Error('AI API Key not configured for this user and no master fallback key found');

    if (sourceMode === 'own_api' && !userData.ai_api_key) {
      throw new Error('AI Setup Missing: Please add your own API key first or switch to SaaS AI mode.');
    }

    // SaaS free-replies + wallet pre-check
    const freeReplyLimit = Number(userData.saas_free_replies_limit) || DEFAULT_FREE_REPLIES_LIMIT;
    const freeRepliesUsed = Number(userData.saas_free_replies_used) || 0;
    const walletBalanceINR = Number(userData.saas_wallet_balance_inr) || 0;

    if (sourceMode === 'saas_ai') {
      if (freeRepliesUsed >= freeReplyLimit && walletBalanceINR <= 0) {
        throw new Error('INSUFFICIENT_WALLET_BALANCE: Free 10 replies khatam. AI Setup page par recharge karein.');
      }
    }

    const userInstruction = userData.ai_system_prompt || 'You are a CEO of a tech agency. Your tone is bold and direct.';
    const systemPrompt = `You are a professional Messaging Assistant. You must reply in a concise, human-like manner. Never mention you are an AI or a language model. Keep replies short and suitable for chat. Use the same language as the user (Hindi/English). \nClient Custom Instruction: ${userInstruction}`;

    const temperature = userData.ai_temperature || 0.7;
    const maxTokens = userData.ai_max_tokens || 1000;
    const spendLimit = Number(userData.ai_spend_limit) || 999999;

    // 1b. Check Spend Limit Protection
    const statsDoc = await adminDb.collection('users').doc(ownerId).collection('ai_stats').doc('all_time').get();
    const currentCost = statsDoc.data()?.totalCost || 0;

    if (currentCost >= spendLimit) {
      throw new Error('SPEND_LIMIT_EXCEEDED: Aapka AI budget khatam ho gaya hai. Dashboard par limit badlein.');
    }

    // 2. Fetch Context (Last 10 messages)
    const messagesQuery = await adminDb.collection('chat_messages')
      .where('ownerId', '==', ownerId)
      .where('contactPhone', '==', contactPhone)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const history = messagesQuery.docs.map(doc => ({
      role: doc.data().direction === 'inbound' ? 'user' : 'assistant',
      content: doc.data().content
    })).reverse();

    // 3. Call Provider
    let aiReply = '';
    let usedInputTokens = 0;
    let usedOutputTokens = 0;
    let usedThinkingTokens = 0;

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: userMessage }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error('Free Tier Quota khatam — wait karein / billing add karein / model badlo (OpenAI)');
        if (res.status === 401) throw new Error('API key galat (OpenAI) — platform.openai.com se nayi lein');
        if (res.status === 403) throw new Error('Permission nahi (OpenAI) — Restricted access / Forbidden');
        if (res.status === 404) throw new Error('Model nahi mila (OpenAI) — model name check karein');
        if (res.status === 500) throw new Error('OpenAI server problem — baad mein try karo');

        const err = await res.text();
        throw new Error(`OpenAI Error: ${err}`);
      }

      const data = await res.json();
      aiReply = data.choices[0].message.content;

      // Track usage
      if (data.usage) {
        usedInputTokens = Number(data.usage.prompt_tokens) || 0;
        usedOutputTokens = Number(data.usage.completion_tokens) || 0;
        await trackUsage(ownerId, 'openai', model, data.usage.prompt_tokens, data.usage.completion_tokens);
      }

    } else if (provider === 'google') {
      // Clean up model name for Gemini
      const cleanModel = model.startsWith('models/') ? model : `models/${model}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...history.map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }]
            })),
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        })
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error('Free Tier Quota khatam — wait karein / billing add karein / model badlein');
        if (res.status === 401) throw new Error('API key galat — kahan se nayi leni hai detail ke liye click karein: https://aistudio.google.com/app/apikey');
        if (res.status === 403) throw new Error('Permission nahi — Google AI Studio (https://aistudio.google.com) par project verify karein');
        if (res.status === 404) throw new Error('Model nahi mila — Gemini 2.0 Flash/Lite use karo');
        if (res.status === 400) throw new Error('Request galat — model badlo / chat saaf karo');
        if (res.status === 500) throw new Error('Google server problem — baad mein try karo');
        if (res.status === 503) throw new Error('Server busy — wait karo');
        throw new Error(`Google AI API Error (${res.status})`);
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Gemini returned invalid response format.`);
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini responded with empty content.`);
      }
      aiReply = data.candidates[0].content.parts[0].text;

      // Track usage
      if (data.usageMetadata) {
        usedInputTokens = Number(data.usageMetadata.promptTokenCount) || 0;
        usedOutputTokens = Number(data.usageMetadata.candidatesTokenCount) || 0;
        usedThinkingTokens = Number(data.usageMetadata.thoughtsTokenCount || 0) || 0;
        await trackUsage(
          ownerId,
          'google',
          model,
          data.usageMetadata.promptTokenCount,
          data.usageMetadata.candidatesTokenCount,
          data.usageMetadata.thoughtsTokenCount || 0
        );
      }
    }

    // Post-usage accounting
    if (sourceMode === 'saas_ai') {
      // Calculate usage-based USD cost. If metadata missing, minimum fallback applies.
      let estimatedUSD = 0;
      if (usedInputTokens > 0 || usedOutputTokens > 0 || usedThinkingTokens > 0) {
        const usageEstimate = await estimateUsageCostUSD(model, usedInputTokens, usedOutputTokens, usedThinkingTokens);
        estimatedUSD = usageEstimate.totalCost;
      }

      const { usdInrRate, saasMarkupMultiplier, minReplyChargeInr } = await getSaasCostConfig();
      const fallbackChargeINR = Number(minReplyChargeInr) || DEFAULT_MIN_REPLY_CHARGE_INR;
      const estimatedChargeINR = Math.max(
        fallbackChargeINR,
        toINRFromUSD(Math.max(estimatedUSD, 0), usdInrRate, saasMarkupMultiplier),
      );

      const userRef = adminDb.collection('users').doc(ownerId);
      const txRef = userRef.collection('wallet_transactions').doc();

      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const latest = snap.data() || {};
        const latestUsed = Number(latest.saas_free_replies_used) || 0;
        const latestLimit = Number(latest.saas_free_replies_limit) || DEFAULT_FREE_REPLIES_LIMIT;
        const latestWallet = Number(latest.saas_wallet_balance_inr) || 0;

        if (latestUsed < latestLimit) {
          tx.update(userRef, {
            saas_free_replies_used: latestUsed + 1,
            saas_free_replies_limit: latestLimit,
            saas_wallet_currency: 'INR',
            saas_block_reason: null,
            saas_last_charge_at: new Date(),
            updatedAt: new Date(),
          });

          tx.set(txRef, {
            type: 'debit',
            source: 'free_quota',
            status: 'applied',
            amount_inr: 0,
            balance_before: latestWallet,
            balance_after: latestWallet,
            model,
            provider,
            source_mode: 'saas_ai',
            note: 'Free reply consumed',
            createdAt: new Date(),
          });
          return;
        }

        if (latestWallet < estimatedChargeINR) {
          tx.update(userRef, {
            saas_block_reason: 'insufficient_balance',
            updatedAt: new Date(),
          });
          throw new Error('INSUFFICIENT_WALLET_BALANCE: Wallet low. Recharge required.');
        }

        const newBalance = Number((latestWallet - estimatedChargeINR).toFixed(4));
        tx.update(userRef, {
          saas_wallet_balance_inr: newBalance,
          saas_wallet_currency: 'INR',
          saas_block_reason: null,
          saas_last_charge_at: new Date(),
          updatedAt: new Date(),
        });

        tx.set(txRef, {
          type: 'debit',
          source: 'ai_usage',
          status: 'applied',
          amount_inr: estimatedChargeINR,
          balance_before: latestWallet,
          balance_after: newBalance,
          model,
          provider,
          source_mode: 'saas_ai',
          note: 'SaaS AI reply charge',
          createdAt: new Date(),
        });
      });
    }

    return aiReply;
  } catch (error: any) {
    console.error('AI Service Error:', error);

    // Convert technical errors to user-friendly messages
    let userMessage = error.message;

    if (userMessage.includes('fetch failed') || userMessage.includes('Failed to fetch') || userMessage.includes('Network request failed')) {
      userMessage = 'Browser block — Firefox use karo / Live Server check karo';
    }

    if (userMessage.includes('insufficient_quota')) {
      userMessage = 'Free Tier Quota khatam — wait karein / billing add karein / model badlein (OpenAI)';
    }

    if (userMessage.includes('SPEND_LIMIT_EXCEEDED')) {
      userMessage = 'Budget Exceeded: Aapka set kiya hua AI budget khatam ho gaya hai. Dashboard se limit badlein ya reset karein.';
    }
    // Throw user-friendly error directly to client
    throw new Error(userMessage);
  }
}
