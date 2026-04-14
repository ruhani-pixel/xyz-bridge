'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format, subDays, parse } from 'date-fns';

export function useDailyTrend(ownerId: string | undefined, days = 7) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    // We want the last X days
    const startDate = subDays(new Date(), days);
    const startDateKey = format(startDate, 'yyyyMMdd'); // V2 uses yyyymmdd

    const q = query(
      collection(db, 'users', ownerId, 'stats'),
      where('__name__', '>=', `daily_${startDateKey}`),
      where('__name__', '<=', `daily_99991231`)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statsMap = new Map();
      snapshot.docs.forEach(doc => {
        if (doc.id.startsWith('daily_')) {
          const dateStr = doc.id.replace('daily_', '');
          statsMap.set(dateStr, doc.data());
        }
      });

      const trendData = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const key = format(d, 'yyyyMMdd');
        const dayLabel = format(d, 'EEE'); // Mon, Tue, etc.
        const dayStats = statsMap.get(key) || { totalInbound: 0, totalOutbound: 0 };
        const widgetIn = dayStats.widgetInbound || 0;
        const widgetOut = dayStats.widgetOutbound || 0;
        const totalIn = dayStats.totalInbound || 0;
        const totalOut = dayStats.totalOutbound || 0;

        const waIn = Math.max(0, totalIn - widgetIn);
        const waOut = Math.max(0, totalOut - widgetOut);
        
        trendData.push({
          day: dayLabel,
          inbound: totalIn,
          outbound: totalOut,
          waIn,
          waOut,
          wbIn: widgetIn,
          wbOut: widgetOut,
          date: key
        });
      }

      setData(trendData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId, days]);

  return { data, loading };
}
