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
      if (!contactRes.ok) throw new Error(contactData.message || 'Failed to create contact in Chatwoot');
      contact = contactData.payload?.contact || contactData;
    }
    
    contactId = contact.id;
    if (!contactId) throw new Error('Could not identify contact ID in Chatwoot');

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
      if (!inboxRes.ok) throw new Error(inboxData.message || 'Failed to link contact to inbox in Chatwoot');
      sourceId = inboxData.source_id;
    }

    if (!sourceId) throw new Error('Could not identify source ID in Chatwoot');

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
      if (!convRes.ok) throw new Error(convData.message || 'Failed to create conversation in Chatwoot');
      conversationId = convData.id;
    }

    if (!conversationId) throw new Error('Could not identify conversation ID in Chatwoot');

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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send message to Chatwoot');
    return data;
  },

  async getProfile(baseUrl: string, token: string) {
    const res = await fetch(`${baseUrl}/api/v1/profile`, {
      headers: { 'Content-Type': 'application/json', api_access_token: token },
    });
    if (!res.ok) throw new Error('Invalid Token or Base URL');
    return await res.json();
  },

  async getInboxes(baseUrl: string, token: string, accountId: string | number) {
    const res = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, {
      headers: { 'Content-Type': 'application/json', api_access_token: token },
    });
    if (!res.ok) throw new Error('Failed to fetch inboxes');
    return await res.json();
  },

  async testConnection(config: any) {
    const testPhoneNumber = '+910000000000';
    const testName = 'Test User (XYZ Bridge)';
    const testMessage = 'This is a test message from XYZ Bridge! If you see this, your integration is working correctly.';
    
    // Create/Find test contact and conversation
    const { conversationId } = await this.createContactAndConversation(testPhoneNumber, testName, config);
    
    // Send message as incoming
    return await this.sendMessage(conversationId, testMessage, 'incoming', config);
  }
};
