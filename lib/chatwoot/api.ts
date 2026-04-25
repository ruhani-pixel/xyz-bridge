// Production-grade Chatwoot API Library
// Handles timeouts, URL normalization, and robust error parsing

const FETCH_TIMEOUT = 10000; // 10 seconds

/**
 * Enhanced fetch with timeout and standard headers
 */
async function fetchWithTimeout(url: string, options: any) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Chatwoot API request timed out (10s). Check your Chatwoot server speed.');
    }
    throw error;
  }
}

/**
 * Safely parse JSON from response, handling HTML error pages
 */
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    if (!text) return { success: res.ok };
    return JSON.parse(text);
  } catch (e) {
    // If it's HTML (usually a 404 or 500 error page)
    if (text.includes('<!DOCTYPE html>')) {
      throw new Error(`Chatwoot returned an HTML error page (Status: ${res.status}). Ensure the Base URL is correct.`);
    }
    throw new Error(`Chatwoot returned invalid JSON (Status: ${res.status}). Body snippet: ${text.substring(0, 100)}`);
  }
}

/**
 * Normalize Base URL to prevent double slashes
 */
function normalizeUrl(url: string) {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

export const sendToChatwoot = {

  /**
   * CORE: Forward an inbound message to Chatwoot
   * Automatically creates or finds a contact, links it to the inbox, and starts a conversation.
   */
  async forwardInbound(phoneNumber: string, name: string, text: string, config: any) {
    const { chatwoot_api_token, chatwoot_account_id, chatwoot_inbox_id } = config;
    const baseUrl = normalizeUrl(config.chatwoot_base_url);
    
    if (!baseUrl || !chatwoot_api_token || !chatwoot_account_id) {
      throw new Error('Chatwoot setup incomplete. Please check your settings.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'api_access_token': chatwoot_api_token
    };

    // Normalize phone number for Chatwoot (+91 format preferred)
    const phone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // ── Step 1: Create or Find Contact ──
    const contactRes = await fetchWithTimeout(
      `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/contacts`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inbox_id: Number(chatwoot_inbox_id),
          name: name || phone,
          phone_number: phone,
          identifier: phone,
        }),
      }
    );

    let contactData = await safeJson(contactRes);
    let contactId: number | undefined;
    let sourceId: string | undefined;

    if (contactRes.ok) {
      const c = contactData.payload?.contact || contactData;
      contactId = c.id;
      sourceId = c.contact_inboxes?.[0]?.source_id;
    } else if (contactRes.status === 422 || contactRes.status === 409) {
      // If contact already exists, search for it
      const searchRes = await fetchWithTimeout(
        `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/contacts/search?q=${phoneNumber.replace('+', '')}`,
        { headers }
      );
      const searchData = await safeJson(searchRes);
      const found = searchData.payload?.[0] || searchData[0];
      if (found) contactId = found.id;
    }

    if (!contactId) {
      throw new Error(`Failed to identify contact in Chatwoot (${contactRes.status})`);
    }

    // ── Step 2: Ensure Contact is linked to Inbox and get Source ID ──
    if (!sourceId) {
      const linkRes = await fetchWithTimeout(
        `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ inbox_id: Number(chatwoot_inbox_id) }),
        }
      );
      const linkData = await safeJson(linkRes);
      sourceId = linkData.source_id;
    }

    if (!sourceId) {
      // Absolute fallback
      sourceId = phone;
    }

    // ── Step 3: Create Conversation with Message ──
    const convRes = await fetchWithTimeout(
      `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/conversations`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_id: sourceId,
          inbox_id: Number(chatwoot_inbox_id),
          contact_id: contactId,
          status: 'open',
          message: {
            content: text,
            message_type: 'incoming',
            private: false,
          },
        }),
      }
    );

    const convData = await safeJson(convRes);
    if (!convRes.ok) {
      throw new Error(`Chatwoot could not create conversation: ${convData.message || convRes.status}`);
    }

    return {
      success: true,
      conversationId: convData.id,
      contactId,
      sourceId,
    };
  },

  /**
   * Send a message to an EXISTING conversation
   */
  async sendMessage(conversationId: number, content: string, messageType: 'incoming' | 'outgoing', config: any) {
    const { chatwoot_api_token, chatwoot_account_id } = config;
    const baseUrl = normalizeUrl(config.chatwoot_base_url);
    
    if (!baseUrl || !chatwoot_api_token || !chatwoot_account_id) {
      throw new Error('Chatwoot setup incomplete.');
    }

    const res = await fetchWithTimeout(
      `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'api_access_token': chatwoot_api_token 
        },
        body: JSON.stringify({
          content,
          message_type: messageType,
          private: false,
          content_type: 'text',
        }),
      }
    );
    
    const data = await safeJson(res);
    if (!res.ok) {
      // Special handling for 404
      if (res.status === 404) {
        throw new Error('404: Conversation not found in Chatwoot. It might have been deleted.');
      }
      throw new Error(data.message || `Chatwoot error (${res.status})`);
    }
    return data;
  },

  /**
   * Profile check
   */
  async getProfile(baseUrl: string, token: string) {
    const url = `${normalizeUrl(baseUrl)}/api/v1/profile`;
    const res = await fetchWithTimeout(url, {
      headers: { 'api_access_token': token },
    });
    if (!res.ok) throw new Error(`Profile check failed (${res.status}). Verify Token/URL.`);
    return await safeJson(res);
  },

  /**
   * Fetch inboxes
   */
  async getInboxes(baseUrl: string, token: string, accountId: string | number) {
    const url = `${normalizeUrl(baseUrl)}/api/v1/accounts/${accountId}/inboxes`;
    const res = await fetchWithTimeout(url, {
      headers: { 'api_access_token': token },
    });
    if (!res.ok) throw new Error(`Failed to fetch inboxes (${res.status})`);
    return await safeJson(res);
  },

  /**
   * Final test helper
   */
  async testConnection(config: any) {
    return await this.forwardInbound(
      '910000000000',
      'Test User (XYZ Bridge)',
      '🧪 [Production Test] Bridge is live and sync is working!',
      config
    );
  },
};
