'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Message } from '../types/message';

export function useMessages(ownerId: string | undefined, limitCount = 50) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    const fetchMessages = (useOrder = true) => {
      let q;
      if (useOrder) {
        q = query(
          collection(db, 'chat_messages'),
          where('ownerId', '==', ownerId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, 'chat_messages'),
          where('ownerId', '==', ownerId),
          limit(limitCount)
        );
      }

      return onSnapshot(q, (snapshot) => {
        let msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        
        if (!useOrder) {
          msgs.sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
          });
        }
        
        setMessages(msgs);
        setLoading(false);
      }, (error) => {
        if (useOrder && error.code === 'failed-precondition') {
          console.warn('Index missing in useMessages, falling back to client-side sort');
          fetchMessages(false);
        } else {
          console.error('useMessages error:', error);
          setLoading(false);
        }
      });
    };

    const unsubscribe = fetchMessages(true);
    return () => unsubscribe && typeof unsubscribe === 'function' ? unsubscribe() : undefined;
  }, [ownerId, limitCount]);

  return { messages, loading };
}
