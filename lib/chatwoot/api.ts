// Safe JSON parser - handles HTML error pages from Chatwoot
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Chatwoot returned non-JSON (Status: ${res.status}). Body: ${text.substring(0, 200)}`);
  }
}

export const sendToChatwoot = {

  /**
   * CORE: Forward an inbound message to Chatwoot
   * Uses the exact Chatwoot docs pattern:
   *   1. POST /contacts (with inbox_id) → creates contact + auto-links inbox
   *   2. POST /conversations (with source_id, inbox_id, contact_id, message)
   */
  async forwardInbound(phoneNumber: string, name: string, text: string, config: any) {
    const { chatwoot_api_token, chatwoot_account_id, chatwoot_inbox_id } = config;
    // CRITICAL: Strip trailing slash to prevent double-slash 404
    const baseUrl = (config.chatwoot_base_url || '').trim().replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api_access_token': chatwoot_api_token
    };

    const phone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    console.log('[Chatwoot] forwardInbound →', { baseUrl, phone, name, text: text.substring(0, 50) });

    // ── Step 1: Create or find contact (with inbox_id so it auto-links) ──
    const contactRes = await fetch(
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

    const contactData = await safeJson(contactRes);
    console.log('[Chatwoot] Contact response status:', contactRes.status, JSON.stringify(contactData).substring(0, 300));

    // Chatwoot returns contact in different shapes:
    //   - New contact: { payload: { contact: { id, contact_inboxes: [...] } } }
    //   - Existing contact (409): { message: "...", contact: { id, ... } }
    let contactId: number | undefined;
    let sourceId: string | undefined;

    if (contactRes.status === 200 || contactRes.status === 201) {
      // Newly created
      const c = contactData.payload?.contact || contactData;
      contactId = c.id;
      const inboxes = c.contact_inboxes || [];
      if (inboxes.length > 0) {
        sourceId = inboxes[0].source_id;
      }
    } else if (contactRes.status === 422 || contactRes.status === 409) {
      // Already exists - extract contact info from error response
      const existingContact = contactData.contact || contactData.payload?.contact;
      if (existingContact) {
        contactId = existingContact.id;
      }
    }

    // If we couldn't get contactId from create, search for it
    if (!contactId) {
      console.log('[Chatwoot] Contact create returned unexpected format, searching...');
      const searchRes = await fetch(
        `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/contacts/search?q=${phoneNumber.replace('+', '')}`,
        { headers }
      );
      if (searchRes.ok) {
        const searchData = await safeJson(searchRes);
        const found = searchData.payload?.[0] || searchData[0];
        if (found) {
          contactId = found.id;
        }
      }
    }

    if (!contactId) {
      throw new Error(`Could not create/find contact in Chatwoot for ${phone}`);
    }
    console.log('[Chatwoot] contactId =', contactId);

    // ── Step 2: Get source_id if we don't have it yet ──
    if (!sourceId) {
      // Check existing contact_inboxes
      const ciRes = await fetch(
        `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`,
        { headers }
      );
      if (ciRes.ok) {
        const ciData = await safeJson(ciRes);
        const ciArr = ciData.payload || ciData || [];
        const match = (Array.isArray(ciArr) ? ciArr : []).find(
          (ci: any) => ci.inbox?.id === Number(chatwoot_inbox_id)
        );
        if (match) sourceId = match.source_id;
      }

      // If still no sourceId, create contact_inbox link
      if (!sourceId) {
        console.log('[Chatwoot] Linking contact to inbox...');
        const linkRes = await fetch(
          `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ inbox_id: Number(chatwoot_inbox_id) }),
          }
        );
        if (linkRes.ok) {
          const linkData = await safeJson(linkRes);
          sourceId = linkData.source_id;
        }
      }
    }

    // Fallback source_id
    if (!sourceId) {
      sourceId = phone;
      console.log('[Chatwoot] Using phone as sourceId fallback:', sourceId);
    }
    console.log('[Chatwoot] sourceId =', sourceId);

    // ── Step 3: Create conversation WITH initial message (Chatwoot docs way) ──
    const convBody = {
      source_id: sourceId,
      inbox_id: Number(chatwoot_inbox_id),
      contact_id: contactId,
      status: 'open',
      message: {
        content: text,
        message_type: 'incoming',
        private: false,
      },
    };

    console.log('[Chatwoot] Creating conversation with message:', JSON.stringify(convBody));
    const convRes = await fetch(
      `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/conversations`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(convBody),
      }
    );

    const convData = await safeJson(convRes);
    console.log('[Chatwoot] Conversation response status:', convRes.status, JSON.stringify(convData).substring(0, 300));

    if (!convRes.ok) {
      throw new Error(`Conversation create failed (${convRes.status}): ${JSON.stringify(convData).substring(0, 200)}`);
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
    const baseUrl = (config.chatwoot_base_url || '').trim().replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api_access_token': chatwoot_api_token
    };

    console.log('[Chatwoot] sendMessage →', { conversationId, messageType, content: content.substring(0, 50) });

    const res = await fetch(
      `${baseUrl}/api/v1/accounts/${chatwoot_account_id}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content,
          message_type: messageType,
          private: false,
          content_type: 'text',
        }),
      }
    );
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || `sendMessage failed (${res.status})`);
    return data;
  },

  /**
   * Profile check (used by settings UI)
   */
  async getProfile(baseUrl: string, token: string) {
    const res = await fetch(`${baseUrl}/api/v1/profile`, {
      headers: { 'Content-Type': 'application/json', api_access_token: token },
    });
    if (!res.ok) throw new Error('Invalid Token or Base URL');
    return await safeJson(res);
  },

  /**
   * Fetch inboxes (used by settings UI)
   */
  async getInboxes(baseUrl: string, token: string, accountId: string | number) {
    const res = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, {
      headers: { 'Content-Type': 'application/json', api_access_token: token },
    });
    if (!res.ok) throw new Error('Failed to fetch inboxes');
    return await safeJson(res);
  },

  /**
   * Test button: send a test incoming message to Chatwoot
   */
  async testConnection(config: any) {
    return await this.forwardInbound(
      '910000000000',
      'Test User (XYZ Bridge)',
      '🧪 This is a test message from XYZ Bridge! If you see this, your integration is working correctly.',
      config
    );
  },
};
