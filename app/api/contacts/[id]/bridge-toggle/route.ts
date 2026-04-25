import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const contactRef = adminDb.collection('contacts').doc(params.id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contactDoc.data()?.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validation: if enabling Bridge Mode, ensure Chatwoot is configured
    if (enabled) {
      const userDoc = await adminDb.collection('users').doc(ownerId).get();
      const userData = userDoc.data();

      const isChatwootConfigured = !!(
        userData?.chatwoot_api_token && 
        userData?.chatwoot_account_id && 
        userData?.chatwoot_inbox_id && 
        userData?.chatwoot_base_url
      );

      if (!isChatwootConfigured) {
        return NextResponse.json({
          error: 'Chatwoot Setup Missing',
          message: 'Bhai, pehle Settings mein jaakar Chatwoot setup (API Token, Account ID, Inbox ID) karein tabhi Bridge ON kar sakte hain.'
        }, { status: 400 });
      }
    }

    await contactRef.update({
      bridgeEnabled: enabled,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Bridge Toggle Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
