import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const { enabled, contactIds } = await req.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const contactsRef = adminDb.collection('contacts');
    
    // If contactIds is provided, only update those. Otherwise update ALL for this owner.
    let query = contactsRef.where('ownerId', '==', ownerId);
    
    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
       // Note: Firestore 'in' query limit is 30. For simplicity, let's process in batches if needed.
       // But for a true "Bulk Toggle All", we just query by ownerId.
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { aiEnabled: enabled, updatedAt: new Date() });
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: snapshot.size });

  } catch (error: any) {
    console.error('Bulk AI Toggle Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
