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

    console.log('Starting Chatwoot Test for user:', decodedToken.uid);

    const { base_url, api_token, account_id, inbox_id } = await req.json();
    console.log('Config received:', { base_url, account_id, inbox_id });

    if (!base_url || !api_token || !account_id || !inbox_id) {
      return NextResponse.json({ error: 'Missing configuration details' }, { status: 400 });
    }

    const cleanUrl = base_url.trim().replace(/\/$/, '');

    // Ensure a contact exists in our DB for the test number
    const testPhoneNumber = '910000000000';
    console.log('Ensuring test contact exists for phone:', testPhoneNumber);
    const contactsRef = adminDb.collection('contacts');
    const contactSnap = await contactsRef
      .where('ownerId', '==', decodedToken.uid)
      .where('phoneNumber', '==', testPhoneNumber)
      .limit(1)
      .get();

    let contactRef;
    if (contactSnap.empty) {
      console.log('Creating new test contact in Firestore...');
      contactRef = await contactsRef.add({
        ownerId: decodedToken.uid,
        phoneNumber: testPhoneNumber,
        name: 'Test User (XYZ Bridge)',
        source: 'whatsapp',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      console.log('Test contact already exists in Firestore.');
      contactRef = contactSnap.docs[0].ref;
    }

    const config = {
      chatwoot_base_url: cleanUrl,
      chatwoot_api_token: api_token,
      chatwoot_account_id: account_id,
      chatwoot_inbox_id: inbox_id
    };

    console.log('Calling sendToChatwoot.testConnection...');
    const result = await sendToChatwoot.testConnection(config);
    console.log('testConnection result:', result);

    if (result.conversation_id || (result.payload && result.payload.conversation_id)) {
      const convId = result.conversation_id || result.payload.conversation_id;
      console.log('Updating contact with conversation ID:', convId);
      await contactRef.update({
        chatwootConversationId: convId
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent to Chatwoot!',
      data: result
    });

  } catch (error: any) {
    console.error('CRITICAL: Test Chatwoot Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send test message',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
