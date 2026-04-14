import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendMSG91Template } from '@/lib/msg91/api';
import { decrypt } from '@/lib/security';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const { phoneNumber, name, templateName, variables } = await req.json();

    if (!phoneNumber || !templateName) {
      return NextResponse.json({ error: 'Missing phone or template' }, { status: 400 });
    }

    // 1. Get User Config
    const userDoc = await adminDb.collection('users').doc(ownerId).get();
    const userData = userDoc.data();

    if (!userData?.msg91_authkey || !userData?.msg91_integrated_number) {
      return NextResponse.json({ error: 'MSG91 not configured' }, { status: 400 });
    }

    const config = {
      msg91_authkey: decrypt(userData.msg91_authkey),
      msg91_integrated_number: userData.msg91_integrated_number
    };

    // 2. Send via MSG91
    const result = await sendMSG91Template(phoneNumber, templateName, config, variables || []);

    // 3. Ensure Contact Exists
    const contactQuery = await adminDb.collection('contacts')
      .where('ownerId', '==', ownerId)
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    let contactRef;
    if (contactQuery.empty) {
      const newContactDoc = adminDb.collection('contacts').doc();
      contactRef = newContactDoc;
      await newContactDoc.set({
        ownerId,
        phoneNumber,
        name: name || phoneNumber,
        aiEnabled: userData.ai_default_enabled ?? true,
        unreadCount: 0,
        source: 'whatsapp',
        lastMessage: `Template: ${templateName}`,
        lastMessageAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      contactRef = contactQuery.docs[0].ref;
      await contactRef.update({
        lastMessage: `Template: ${templateName}`,
        lastMessageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 4. Record Message
    await adminDb.collection('chat_messages').add({
      ownerId,
      contactPhone: phoneNumber,
      direction: 'outbound',
      sender: 'agent',
      content: `[Template: ${templateName}]`,
      contentType: 'template',
      status: 'sent',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('Send Template API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
