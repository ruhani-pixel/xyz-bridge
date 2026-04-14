import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { buildDateKey } from '@/lib/utils';
import { verifyIdToken } from '@/lib/firebase/auth';

export async function GET(req: NextRequest) {
  // Validate token
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = await verifyIdToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const dateKey = buildDateKey();
    const [dailyDoc, totalDoc, activeConvSnap] = await Promise.all([
      adminDb.collection('stats').doc(`daily_${dateKey}`).get(),
      adminDb.collection('stats').doc('total').get(),
      adminDb.collection('contacts').where('status', '==', 'active').count().get()
    ]);

    return NextResponse.json({
      daily: dailyDoc.exists ? dailyDoc.data() : { totalInbound: 0, totalOutbound: 0, failedMessages: 0 },
      total: totalDoc.exists ? totalDoc.data() : { totalInbound: 0, totalOutbound: 0 },
      activeConversations: activeConvSnap.data().count
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
