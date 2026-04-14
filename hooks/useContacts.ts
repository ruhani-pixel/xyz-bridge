'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Contact } from '../types/contact';

export function useContacts(ownerId: string | undefined) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    const fetchContacts = (useOrder = true) => {
      let q;
      if (useOrder) {
        q = query(
          collection(db, 'contacts'),
          where('ownerId', '==', ownerId),
          orderBy('lastMessageAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'contacts'),
          where('ownerId', '==', ownerId)
        );
      }

      return onSnapshot(q, (snapshot) => {
        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Contact[];
        
        if (!useOrder) {
          data.sort((a, b) => {
            const timeA = a.lastMessageAt?.seconds || 0;
            const timeB = b.lastMessageAt?.seconds || 0;
            return timeB - timeA;
          });
        }
        
        setContacts(data);
        setLoading(false);
      }, (error) => {
        if (useOrder && error.code === 'failed-precondition') {
          console.warn('Index missing in useContacts, falling back to client-side sort');
          fetchContacts(false);
        } else {
          console.error('useContacts error:', error);
          setLoading(false);
        }
      });
    };

    const unsubscribe = fetchContacts(true);
    return () => unsubscribe && typeof unsubscribe === 'function' ? unsubscribe() : undefined;
  }, [ownerId]);

  return { contacts, loading };
}
