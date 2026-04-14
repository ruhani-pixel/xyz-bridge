import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildDateKey } from '../utils';

/**
 * Increments message statistics for a user in real-time.
 * Segregates data by day and hour for the "Message Flow" charts.
 */
export async function incrementMessageStats(
  ownerId: string, 
  direction: 'inbound' | 'outbound',
  source: 'whatsapp' | 'widget'
) {
  try {
    const now = new Date();
    const dateKey = buildDateKey(now);
    const hour = now.getHours().toString().padStart(2, '0');
    
    const userRef = adminDb.collection('users').doc(ownerId);
    
    // 1. Update Daily/Summary Stats
    const summaryRef = userRef.collection('stats').doc('realtime');
    const summaryUpdate: any = {
      lastActivityAt: FieldValue.serverTimestamp(),
    };

    if (direction === 'inbound') {
      summaryUpdate.totalInbound = FieldValue.increment(1);
      if (source === 'whatsapp') summaryUpdate.whatsappInbound = FieldValue.increment(1);
      if (source === 'widget') summaryUpdate.widgetInbound = FieldValue.increment(1);
    } else {
      summaryUpdate.totalOutbound = FieldValue.increment(1);
      if (source === 'whatsapp') summaryUpdate.whatsappOutbound = FieldValue.increment(1);
      if (source === 'widget') summaryUpdate.widgetOutbound = FieldValue.increment(1);
    }

    await summaryRef.set(summaryUpdate, { merge: true });

    // 2. Update Hourly Stats for the Chart
    const hourlyId = `hourly_${dateKey}_${hour}`;
    const hourlyRef = userRef.collection('stats').doc(hourlyId);
    
    await hourlyRef.set({
      date: dateKey,
      hour: hour,
      totalInbound: direction === 'inbound' ? FieldValue.increment(1) : FieldValue.increment(0),
      totalOutbound: direction === 'outbound' ? FieldValue.increment(1) : FieldValue.increment(0),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // 3. Keep user-level total count synchronized for subscription limits
    await userRef.update({ 
      messageCount: FieldValue.increment(1),
      lastActive: FieldValue.serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error incrementing stats:', error);
    return false;
  }
}
