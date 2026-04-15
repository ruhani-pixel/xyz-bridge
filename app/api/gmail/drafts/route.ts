import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const body = await req.json();

    const draftId = body.draftId || adminDb.collection('users').doc(uid).collection('gmailDrafts').doc().id;

    await adminDb.collection('users').doc(uid).collection('gmailDrafts').doc(draftId).set({
      ...body,
      id: draftId,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, draftId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');

    // Return single specific draft fully populated
    if (draftId) {
      const doc = await adminDb.collection('users').doc(uid).collection('gmailDrafts').doc(draftId).get();
      if (!doc.exists) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      return NextResponse.json({ draft: doc.data() });
    }

    // Return all drafts summary
    const snapshot = await adminDb
      .collection('users').doc(uid)
      .collection('gmailDrafts')
      .orderBy('updatedAt', 'desc')
      .get();
    
    const drafts = snapshot.docs.map(doc => {
       const data = doc.data();
       return {
          id: doc.id,
          campaignName: data.campaignName || 'Untitled Draft',
          subject: data.subject || '',
          body: data.body || '',
          recipientsCount: data.recipients?.length || 0,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
       }
    });
    
    return NextResponse.json({ drafts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
       return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    await adminDb.collection('users').doc(uid).collection('gmailDrafts').doc(draftId).delete();
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
