'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { buildDateKey } from '../lib/utils';

export function useHourlyStats(ownerId: string | undefined) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    const dateKey = buildDateKey();
    
    // Query user-specific hourly documents for the current day
    const q = query(
      collection(db, 'users', ownerId, 'stats'),
      where('__name__', '>=', `hourly_${dateKey}_00`),
      where('__name__', '<=', `hourly_${dateKey}_23`)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statsMap = new Map<string, { in: number, out: number }>();
      snapshot.docs.forEach(doc => {
        const hour = doc.id.split('_').pop() || '00';
        const docData = doc.data();
        statsMap.set(hour, {
          in: docData.totalInbound || 0,
          out: docData.totalOutbound || 0
        });
      });

      // Fill in all 24 hours
      const chartData = [];
      for (let i = 0; i < 24; i++) {
        const hourLabel = i.toString().padStart(2, '0');
        const stats = statsMap.get(hourLabel) || { in: 0, out: 0 };
        chartData.push({
          time: `${hourLabel}:00`,
          messages: stats.in, // Inbound
          outbound: stats.out, // Outbound
        });
      }

      setData(chartData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId]);

  return { data, loading };
}
