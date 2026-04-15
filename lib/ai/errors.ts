type Provider = 'openai' | 'google';

function shortText(input: string, max = 220) {
    const text = String(input || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function mapAIHttpError(provider: Provider, status: number, rawMessage?: string) {
    const msg = shortText(rawMessage || '');

    if (status === 429) return 'Token/Quota limit aa gaya hai. Billing add karein ya low-cost model select karein.';
    if (status === 401) return provider === 'openai'
        ? 'OpenAI API key invalid hai. Nayi key save karein.'
        : 'Google API key invalid hai. AI Studio se valid key save karein.';
    if (status === 403) return provider === 'openai'
        ? 'OpenAI permission issue hai (403). Project access / organization settings check karein.'
        : 'Google permission issue hai (403). Gemini API access/project permissions verify karein.';
    if (status === 404) return provider === 'openai'
        ? 'OpenAI model nahi mila. Model name verify karein.'
        : 'Gemini model nahi mila. Supported model select karein.';
    if (status === 400) return msg
        ? `Request format issue (400): ${msg}`
        : 'Request format issue (400). Prompt/chat/model fields verify karein.';
    if (status >= 500) return 'AI provider server issue hai. Thodi der baad retry karein.';

    return msg
        ? `AI provider error (${status}): ${msg}`
        : `AI provider error (${status}).`;
}

export function normalizeAIError(error: any) {
    const raw = String(error?.message || 'Unknown error').trim();

    if (/SPEND_LIMIT_EXCEEDED/i.test(raw)) {
        return 'Aapka AI spend limit cross ho gaya hai. Dashboard me limit badhaiye.';
    }

    if (/INSUFFICIENT_WALLET_BALANCE/i.test(raw)) {
        return 'Wallet balance low hai. AI Setup page me recharge karein.';
    }

    if (/insufficient_quota/i.test(raw)) {
        return 'Token/Quota limit aa gaya hai. Billing add karein ya low-cost model use karein.';
    }

    if (/fetch failed|Failed to fetch|Network request failed/i.test(raw)) {
        return 'Network issue detect hua. Internet/Firewall check karke retry karein.';
    }

    return shortText(raw, 260);
}
