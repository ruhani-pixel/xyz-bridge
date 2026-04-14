import { Timestamp } from 'firebase/firestore';

export interface Message {
  id?: string;
  messageId: string;
  ownerId: string;
  direction: 'inbound' | 'outbound';
  source: 'msg91' | 'chatwoot';
  phoneNumber: string;
  contactPhone: string;
  contactName: string;
  content: string;
  contentType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'interactive';
  chatwootConversationId: number;
  msg91RequestId?: string;
  sender?: 'user' | 'ai' | 'agent';
  status: 'received' | 'forwarded' | 'delivered' | 'failed' | 'sent';
  timestamp: Timestamp | Date | any;
  createdAt: Timestamp | Date | any;
}

export interface DailyStats {
  totalInbound: number;
  totalOutbound: number;
  whatsappInbound?: number;
  whatsappOutbound?: number;
  widgetInbound?: number;
  widgetOutbound?: number;
  failedMessages: number;
}

export interface DashboardStats {
  totalInbound: number;
  totalOutbound: number;
  whatsappInbound?: number;
  whatsappOutbound?: number;
  widgetInbound?: number;
  widgetOutbound?: number;
  totalContacts: number;
  totalConversations: number;
  failedMessages: number;
}
