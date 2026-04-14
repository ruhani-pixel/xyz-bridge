import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = userDoc.data() || {};

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch AI Config Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const authUid = decodedToken.uid;

    const data = await req.json();
    const { uid, ai_api_key, ...otherConfig } = data;

    // Security Check: Only allow users to update their own config unless they are superadmin
    if (authUid !== uid) {
       const adminDoc = await adminDb.collection('users').doc(authUid).get();
       if (adminDoc.data()?.role !== 'superadmin') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
    }

    const updateData: any = {
      ...otherConfig,
      ai_api_key: (ai_api_key ?? '').trim(), // Allow clearing the key
      updatedAt: new Date(),
    };

    await adminDb.collection('users').doc(uid).update(updateData);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update AI Config Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
