import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken } from '@/lib/firebase/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const decodedToken = await verifyIdToken(token);
  if (!decodedToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const snapshot = await adminDb.collection('webhookLogs')
      .where('ownerId', '==', decodedToken.uid)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
