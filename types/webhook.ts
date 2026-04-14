export interface Msg91InboundPayload {
  customerNumber: string;
  integratedNumber: string;
  direction: number; // 0 = Inbound
  text?: string;
  contentType: string;
  content?: string;
  requestId: string;
  uuid: string;
  ts: string;
  contacts?: string;
}

export interface ChatwootWebhookPayload {
  event: string;
  id: string;
  content: string;
  message_type: 'incoming' | 'outgoing' | 'template';
  content_type: string;
  private: boolean;
  conversation: {
    id: number;
    contact_inbox: {
      source_id: string;
    };
  };
  sender?: {
    type: string;
    name: string;
  };
}
