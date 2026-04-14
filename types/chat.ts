import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  ownerId: string;
  contactPhone: string;
  direction: 'inbound' | 'outbound';
  sender: 'user' | 'agent' | 'ai';
  content: string;
  contentType: 'text' | 'image' | 'document' | 'interactive';
  aiModel?: string | null;
  status: 'sent' | 'delivered' | 'failed' | 'read' | 'forwarded';
  msg91RequestId?: string;
  timestamp: Timestamp | Date | any;
  createdAt: Timestamp | Date | any;
}
