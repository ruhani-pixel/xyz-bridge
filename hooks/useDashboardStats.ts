'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { buildDateKey } from '../lib/utils';
import { DashboardStats, DailyStats } from '../types/message';

export function useDashboardStats(ownerId: string | undefined) {
  const [dailyStats, setDailyStats] = useState<DailyStats>({ totalInbound: 0, totalOutbound: 0, failedMessages: 0 });
  const [totalStats, setTotalStats] = useState<DashboardStats>({ totalInbound: 0, totalOutbound: 0, totalContacts: 0, totalConversations: 0, failedMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    // Listen to user-specific realtime stats document
    const statsRef = doc(db, 'users', ownerId, 'stats', 'realtime');
    
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const widgetIn = data.widgetInbound || 0;
        const widgetOut = data.widgetOutbound || 0;
        const totalIn = data.totalInbound || 0;
        const totalOut = data.totalOutbound || 0;

        // Calculate WA as fallback for legacy and current WA messages
        const waIn = Math.max(0, totalIn - widgetIn);
        const waOut = Math.max(0, totalOut - widgetOut);

        setDailyStats({
          totalInbound: totalIn,
          totalOutbound: totalOut,
          widgetInbound: widgetIn,
          widgetOutbound: widgetOut,
          whatsappInbound: waIn,
          whatsappOutbound: waOut,
          failedMessages: data.failedMessages || 0
        });

        setTotalStats({
          totalInbound: totalIn,
          totalOutbound: totalOut,
          widgetInbound: widgetIn,
          widgetOutbound: widgetOut,
          whatsappInbound: waIn,
          whatsappOutbound: waOut,
          totalContacts: data.totalContacts || 0,
          totalConversations: data.totalConversations || 0,
          failedMessages: data.failedMessages || 0
        });
      }
      setLoading(false);
    });

    return () => unsubStats();
  }, [ownerId]);

  return { dailyStats, totalStats, loading };
}
