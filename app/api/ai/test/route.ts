import { NextRequest, NextResponse } from 'next/server';
import { trackUsage } from '@/lib/ai/billing';

export async function POST(req: NextRequest) {
  try {
    let { uid, provider, apiKey, model, systemPrompt, temperature, maxTokens, messages, input } = await req.json();

    if (!apiKey) {
      apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GOOGLE_API_KEY;
      if (!provider && apiKey) provider = 'google';
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Please enter an API key first (No master key found)' }, { status: 400 });
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
          temperature: temperature,
          max_tokens: maxTokens,
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
        if (res.status === 429) throw new Error('Free Tier Quota khatam — wait karein / billing add karein / model badlein (OpenAI)');
        if (res.status === 401) throw new Error('API key galat (OpenAI) — platform.openai.com se check karein');
        if (res.status === 403) throw new Error('Permission nahi (OpenAI) — Forbidden / Access Denied');
        if (res.status === 404) throw new Error('Model nahi mila (OpenAI) — check model name');
        if (res.status === 500) throw new Error('OpenAI server problem — baad mein try karo');
        throw new Error(data.error?.message || `OpenAI Error (${res.status}): ${responseBody}`);
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
            temperature: temperature,
            maxOutputTokens: maxTokens,
          }
        })
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error('Free Tier Quota khatam — wait karein / billing add karein / model badlein (Google)');
        if (res.status === 401) throw new Error('API key galat — kahan se nayi leni hai detail ke liye click karein: https://aistudio.google.com/app/apikey');
        if (res.status === 403) throw new Error('Permission Nahi (403): Google AI Studio (aistudio.google.com) par Gemini API service on karein ya project settings check karein. Ye error tab aata hai jab project enable nahi hota.');
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
    
    let userMessage = error.message;
    if (userMessage.includes('fetch failed') || userMessage.includes('Failed to fetch') || userMessage.includes('Network request failed')) {
        userMessage = 'Browser block — Firefox use karo / Live Server check karo';
    }

    // Provide a descriptive error that the client can actually display
    // Return 200 but with an ok: false flag or error string so the browser console
    // doesn't show a red 400 error for expected quota/limit issues.
    return NextResponse.json({ 
      error: userMessage || 'AI Verification failed. Check your API Key and Network.',
      ok: false
    }, { status: 200 });
  }
}
