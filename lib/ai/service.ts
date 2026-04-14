import { adminDb } from '../firebase/admin';
import { trackUsage } from './billing';

export async function generateAIResponse(ownerId: string, contactPhone: string, userMessage: string) {
  try {
    // 1. Fetch User Config
    const userDoc = await adminDb.collection('users').doc(ownerId).get();
    if (!userDoc.exists) throw new Error('User not found');
    const userData = userDoc.data()!;

    const provider = userData.ai_provider || (process.env.GOOGLE_API_KEY ? 'google' : 'openai');
    const apiKey = userData.ai_api_key || (provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GOOGLE_API_KEY);
    
    if (!apiKey) throw new Error('AI API Key not configured for this user and no master fallback key found');
    const model = userData.ai_model || (provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-flash');
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
