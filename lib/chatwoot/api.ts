import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response from Chatwoot (Status: ${res.status}). Body: ${text.substring(0, 100)}...`);
  }
}

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
    const data = await safeJson(res);
    return (data.payload && data.payload[0]) || data[0] || null;
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
      const contactData = await safeJson(contactRes);
      if (!contactRes.ok) throw new Error(contactData.message || 'Failed to create contact in Chatwoot');
      contact = contactData.payload?.contact || contactData;
    }
    
    contactId = contact.id;
    if (!contactId) throw new Error('Could not identify contact ID in Chatwoot');

    // 2. Ensure Contact is linked to Inbox
    const contactInboxesRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`, {
      headers,
    });
    const existingInboxes = await safeJson(contactInboxesRes);
    const inboxesArr = existingInboxes.payload || existingInboxes || [];
    let sourceId = inboxesArr.find((ib: any) => ib.inbox?.id === parseInt(chatwoot_inbox_id))?.source_id;

    if (!sourceId) {
      const inboxRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/contact_inboxes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inbox_id: chatwoot_inbox_id }),
      });
      const inboxData = await safeJson(inboxRes);
      if (!inboxRes.ok) throw new Error(inboxData.message || 'Failed to link contact to inbox in Chatwoot');
      sourceId = inboxData.source_id;
    }

    if (!sourceId) throw new Error('Could not identify source ID in Chatwoot');

    // 3. Find or Create Conversation
    const convsRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/contacts/${contactId}/conversations`, {
      headers,
    });
    const existingConvs = await safeJson(convsRes);
    const convsArr = existingConvs.payload || existingConvs || [];
    let conversationId = convsArr.find((c: any) => c.inbox_id === parseInt(chatwoot_inbox_id) && c.status !== 'resolved')?.id;

    if (!conversationId) {
      const convRes = await fetch(`${chatwoot_base_url}/api/v1/accounts/${chatwoot_account_id}/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_id: sourceId,
          inbox_id: chatwoot_inbox_id,
        }),
      });
      const convData = await safeJson(convRes);
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
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Failed to send message to Chatwoot');
    return data;
  },

  async getProfile(baseUrl: string, token: string) {
    const res = await fetch(`${baseUrl}/api/v1/profile`, {
      headers: { 'Content-Type': 'application/json', api_access_token: token },
    });
    if (!res.ok) throw new Error('Invalid Token or Base URL');
    return await safeJson(res);
  },

  async getInboxes(baseUrl: string, token: string, accountId: string | number) {
    const res = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, {
      headers: { 'Content-Type': 'application/json', api_access_token: token },
    });
    if (!res.ok) throw new Error('Failed to fetch inboxes');
    return await safeJson(res);
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
