import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken } from '@/lib/firebase/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token || !(await verifyIdToken(token))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const limitParams = Number(searchParams.get('limit') || 50);

    const snapshot = await adminDb.collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limitParams)
      .get();

    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
