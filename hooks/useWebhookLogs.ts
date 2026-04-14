'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function useWebhookLogs(ownerId: string | undefined, limitCount = 10) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    const q = query(
      collection(db, 'webhookLogs'),
      where('ownerId', '==', ownerId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logData);
      setLoading(false);
    }, (error) => {
      console.error('useWebhookLogs error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId, limitCount]);

  return { logs, loading };
}
