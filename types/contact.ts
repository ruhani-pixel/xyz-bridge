import { Timestamp } from 'firebase/firestore';

export interface Contact {
  id?: string;
  ownerId: string;
  phoneNumber: string;
  name: string;
  source?: 'whatsapp' | 'widget';
  
  // AI & Automation Settings
  aiEnabled: boolean;
  bridgeEnabled: boolean;
  
  // Conversation Data
  lastMessage: string;
  lastMessageAt: Timestamp | Date | any;
  lastInboundAt?: Timestamp | Date | any;
  totalMessages: number;
  unreadCount: number;
  status: 'active' | 'archived' | 'blocked';
  
  // Bridge mode specific
  chatwootContactId?: number | null;
  chatwootConversationId?: number | null;
  
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
  
  // Real-time AI Status
  isTyping?: boolean;
  aiError?: string | null;
}
