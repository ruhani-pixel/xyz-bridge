import { Timestamp } from 'firebase/firestore';

export interface Contact {
  phoneNumber: string;
  name: string;
  chatwootContactId: number;
  chatwootSourceId: string;
  chatwootConversationId: number;
  lastMessageAt: Timestamp | Date | any;
  totalMessages: number;
  status: 'active' | 'resolved' | 'blocked';
  createdAt: Timestamp | Date | any;
  lastMessage?: string;
  updatedAt: Timestamp | Date | any;
}

export interface Conversation {
  id: string; // the contact document id (phone number)
  contact: Contact;
}
