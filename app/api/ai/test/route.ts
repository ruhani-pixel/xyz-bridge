import { NextRequest, NextResponse } from 'next/server';
import { trackUsage } from '@/lib/ai/billing';
import { mapAIHttpError, normalizeAIError } from '@/lib/ai/errors';

const OPENAI_ALLOWED_MODELS = new Set([
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
]);

const GOOGLE_ALLOWED_MODELS = new Set([
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
]);

function normalizeProvider(value: any): 'openai' | 'google' {
  return value === 'google' ? 'google' : 'openai';
}

function sanitizeMessages(messages: any[]) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .slice(-12)
    .map((m) => ({
      role: m.role === 'ai' ? 'ai' : 'user',
      content: String(m.content).trim(),
    }));
}

function resolveModel(provider: 'openai' | 'google', model: any) {
  const requested = String(model || '').trim();

  if (provider === 'openai') {
    if (OPENAI_ALLOWED_MODELS.has(requested)) return requested;
    return 'gpt-4o';
  }

  if (GOOGLE_ALLOWED_MODELS.has(requested)) return requested;
  return 'gemini-2.0-flash';
}

export async function POST(req: NextRequest) {
  try {
    let { uid, provider, apiKey, model, systemPrompt, temperature, maxTokens, messages, input, sourceMode } = await req.json();

    const isSaas = sourceMode === 'saas_ai';
    
    // SaaS mode overrides provider and model for fixed efficiency
    if (isSaas) {
      provider = 'google';
      model = 'gemini-2.0-flash-lite';
      apiKey = process.env.GOOGLE_API_KEY;
    }

    provider = normalizeProvider(provider);
    model = resolveModel(provider, model);
    systemPrompt = typeof systemPrompt === 'string' ? systemPrompt.trim().slice(0, 1000) : '';
    input = typeof input === 'string' ? input.trim() : '';
    messages = sanitizeMessages(messages);

    const safeTemperature = Number.isFinite(Number(temperature)) ? Math.max(0, Math.min(1, Number(temperature))) : 0.7;
    const safeMaxTokens = Number.isFinite(Number(maxTokens)) ? Math.max(64, Math.min(4096, Number(maxTokens))) : 1000;

    if (!isSaas && (!apiKey || String(apiKey).trim() === '')) {
      return NextResponse.json({ 
        error: 'AI Setup Missing', 
        message: 'Bhai, "Own API" mode me aapko apni API Key daalna jruri hai. Ya fir SaaS AI select karein.' 
      }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'System key missing. Please check .env configuration.' }, { status: 500 });
    }

    if (!input) {
      return NextResponse.json({ error: 'Empty input' }, { status: 400 });
    }

    let responseText = '';

    if (provider === 'openai') {
      const openAiMsgs = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...(messages || []).map((m: any) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
        { role: 'user', content: input }
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: openAiMsgs,
          temperature: safeTemperature,
          max_tokens: safeMaxTokens,
        })
      });

      const responseBody = await res.text();
      let data;
      try {
        data = JSON.parse(responseBody);
      } catch (e) {
        throw new Error(`OpenAI returned non-JSON response: ${responseBody.substring(0, 100)}...`);
      }

      if (!res.ok) {
        throw new Error(
          mapAIHttpError('openai', res.status, data?.error?.message || responseBody)
        );
      }

      responseText = data.choices?.[0]?.message?.content || 'No response content found';

      // Track usage
      if (uid && data.usage) {
        await trackUsage(uid, 'openai', model, data.usage.prompt_tokens, data.usage.completion_tokens);
      }

    } else if (provider === 'google') {
      const cleanModel = model.startsWith('models/') ? model : `models/${model}`;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${apiKey}`;

      const contents = [];
      for (const m of messages || []) {
        contents.push({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.content }] });
      }
      contents.push({ role: 'user', parts: [{ text: input }] });

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          contents,
          generationConfig: {
            temperature: safeTemperature,
            maxOutputTokens: safeMaxTokens,
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        let errJson: any = null;
        try {
          errJson = JSON.parse(errText);
        } catch { }
        const providerMessage = errJson?.error?.message || errText;

        throw new Error(mapAIHttpError('google', res.status, providerMessage));
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Gemini returned invalid response format.`);
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error(`Gemini returned no candidates. Possible safety trigger or internal error.`);
      }

      responseText = data.candidates[0].content?.parts?.[0]?.text || 'Empty response from Gemini';

      // Track usage
      if (uid && data.usageMetadata) {
        await trackUsage(uid, 'google', model, data.usageMetadata.promptTokenCount, data.usageMetadata.candidatesTokenCount);
      }
    }

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error('AI Test Error Details:', error);
    const userMessage = normalizeAIError(error);

    // Provide a descriptive error that the client can actually display
    // Return 200 but with an ok: false flag or error string so the browser console
    // doesn't show a red 400 error for expected quota/limit issues.
    return NextResponse.json({
      error: userMessage || 'AI Verification failed. Check your API Key and Network.',
      ok: false
    }, { status: 200 });
  }
}
