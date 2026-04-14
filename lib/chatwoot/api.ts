export const sendToChatwoot = {
  async createContactAndConversation(phoneNumber: string, name: string, config: any) {
    const { chatwoot_base_url, chatwoot_api_token, chatwoot_account_id, chatwoot_inbox_id } = config;
    const headers = { 'Content-Type': 'application/json', api_access_token: chatwoot_api_token || '' };

    // 1. Create Contact
    const contactRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        phone_number: `+${phoneNumber}`,
      }),
    });
    const contactData = await contactRes.json();
    const contactId = contactData.payload.contact.id;

    // 2. Create Contact Inbox
    const inboxRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inbox_id: chatwoot_inbox_id }),
    });
    const inboxData = await inboxRes.json();
    const sourceId = inboxData.source_id;

    // 3. Create Conversation
    const convRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_id: sourceId,
        inbox_id: chatwoot_inbox_id,
      }),
    });
    const convData = await convRes.json();
    const conversationId = convData.id;

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
