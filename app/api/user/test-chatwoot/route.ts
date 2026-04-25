import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendToChatwoot } from '@/lib/chatwoot/api';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decodedToken = await adminAuth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { base_url, api_token, account_id, inbox_id } = await req.json();

    if (!base_url || !api_token || !account_id || !inbox_id) {
      return NextResponse.json({ error: 'Missing configuration details' }, { status: 400 });
    }

    const cleanUrl = base_url.trim().replace(/\/$/, '');

    // Ensure a contact exists in our DB for the test number
    // so that when Chatwoot replies, we can find it.
    const testPhoneNumber = '910000000000';
    const contactsRef = adminDb.collection('contacts');
    const contactSnap = await contactsRef
      .where('ownerId', '==', decodedToken.uid)
      .where('phoneNumber', '==', testPhoneNumber)
      .limit(1)
      .get();

    let contactRef;
    if (contactSnap.empty) {
      contactRef = await contactsRef.add({
        ownerId: decodedToken.uid,
        phoneNumber: testPhoneNumber,
        name: 'Test User (XYZ Bridge)',
        source: 'whatsapp',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      contactRef = contactSnap.docs[0].ref;
    }

    const config = {
      chatwoot_base_url: cleanUrl,
      chatwoot_api_token: api_token,
      chatwoot_account_id: account_id,
      chatwoot_inbox_id: inbox_id
    };

    const result = await sendToChatwoot.testConnection(config);

    // Update the contact with Chatwoot IDs from the result
    // The result from sendMessage doesn't contain source_id/contact_id directly usually, 
    // but testConnection internally calls createContactAndConversation which we might want to return.
    // Let's modify lib/chatwoot/api.ts slightly to return more info if needed, 
    // or just rely on the webhook to link them later? 
    // Actually, the webhook needs chatwootConversationId.
    
    // Let's modify lib/chatwoot/api.ts testConnection to return conversationId.
    if (result.conversation_id) {
      await contactRef.update({
        chatwootConversationId: result.conversation_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent to Chatwoot!',
      data: result
    });

  } catch (error: any) {
    console.error('Test Chatwoot Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send test message' }, { status: 500 });
  }
}
