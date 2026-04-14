import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken } from '@/lib/firebase/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token || !(await verifyIdToken(token))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';

    const snapshot = await adminDb.collection('contacts')
      .where('status', '==', status)
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get();

    const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
