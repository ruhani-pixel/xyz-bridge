export const sendToChatwoot = {
  async searchContact(phoneNumber: string, config: any) {
    const { chatwoot_base_url, chatwoot_api_token, chatwoot_account_id } = config;
    const headers = { 'Content-Type': 'application/json', api_access_token: chatwoot_api_token || '' };
    
    // Search by phone number (removing + if present for query)
    const query = phoneNumber.replace('+', '');
    const res = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/search?q=${query}`, {
      headers,
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.payload[0] || null;
  },

  async createContactAndConversation(phoneNumber: string, name: string, config: any) {
    const { chatwoot_base_url, chatwoot_api_token, chatwoot_account_id, chatwoot_inbox_id } = config;
    const headers = { 'Content-Type': 'application/json', api_access_token: chatwoot_api_token || '' };

    // 1. Check if contact exists
    let contact = await this.searchContact(phoneNumber, config);
    let contactId;

    if (!contact) {
      // Create Contact if not found
      const contactRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          phone_number: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
        }),
      });
      const contactData = await contactRes.json();
      contact = contactData.payload.contact;
    }
    
    contactId = contact.id;

    // 2. Ensure Contact is linked to Inbox
    const contactInboxesRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`, {
      headers,
    });
    const existingInboxes = await contactInboxesRes.json();
    let sourceId = existingInboxes.find((ib: any) => ib.inbox.id === parseInt(chatwoot_inbox_id))?.source_id;

    if (!sourceId) {
      const inboxRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inbox_id: chatwoot_inbox_id }),
      });
      const inboxData = await inboxRes.json();
      sourceId = inboxData.source_id;
    }

    // 3. Find or Create Conversation
    const convsRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/conversations`, {
      headers,
    });
    const existingConvs = await convsRes.json();
    let conversationId = existingConvs.payload.find((c: any) => c.inbox_id === parseInt(chatwoot_inbox_id) && c.status !== 'resolved')?.id;

    if (!conversationId) {
      const convRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_id: sourceId,
          inbox_id: chatwoot_inbox_id,
        }),
      });
      const convData = await convRes.json();
      conversationId = convData.id;
    }

    return { conversationId, sourceId, contactId };
  },

  async sendMessage(conversationId: number, content: string, messageType: 'incoming' | 'outgoing', config: any) {
    const { chatwoot_base_url, chatwoot_api_token, chatwoot_account_id } = config;
    const headers = { 'Content-Type': 'application/json', api_access_token: chatwoot_api_token || '' };

    const res = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        message_type: messageType,
        private: false,
        content_type: 'text',
      }),
    });
    return await res.json();
  },
};
