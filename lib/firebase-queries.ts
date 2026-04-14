import { adminDb } from './firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildDateKey } from './utils';

export async function incrementStats(statsType: 'inbound' | 'outbound' | 'failed') {
  const dateKey = buildDateKey();
  
  const incrementVal = {
    totalInbound: statsType === 'inbound' ? FieldValue.increment(1) : FieldValue.increment(0),
    totalOutbound: statsType === 'outbound' ? FieldValue.increment(1) : FieldValue.increment(0),
    failedMessages: statsType === 'failed' ? FieldValue.increment(1) : FieldValue.increment(0),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Update daily
  const dailyRef = adminDb.collection('stats').doc(`daily_${dateKey}`);
  await dailyRef.set(incrementVal, { merge: true });

  // Update hourly
  const hourKey = new Date().getHours().toString().padStart(2, '0');
  const hourlyRef = adminDb.collection('stats').doc(`hourly_${dateKey}_${hourKey}`);
  await hourlyRef.set(incrementVal, { merge: true });

  // Update total
  const totalRef = adminDb.collection('stats').doc('total');
  await totalRef.set(incrementVal, { merge: true });
}

export async function getSystemConfig() {
  const doc = await adminDb.collection('settings').doc('systemConfig').get();
  if (!doc.exists) {
    return {
      msg91_authkey: '',
      msg91_integrated_number: '',
      chatwoot_base_url: 'https://app.chatwoot.com',
      chatwoot_api_token: '',
      chatwoot_account_id: '',
      chatwoot_inbox_id: '',
    };
  }
  return doc.data();
}

export async function updateSystemConfig(data: any) {
  await adminDb.collection('settings').doc('systemConfig').set({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
