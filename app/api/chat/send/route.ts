import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendMSG91Reply } from '@/lib/msg91/api';
import { decrypt } from '@/lib/security';
import { FieldValue } from 'firebase-admin/firestore';
import { incrementMessageStats } from '@/lib/firebase/stats-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const { contactId, phoneNumber, content } = await req.json();

    if (!phoneNumber || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 2. Load User MSG91 Config
    const userDoc = await adminDb.collection('users').doc(ownerId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User configuration not found' }, { status: 404 });
    }
    const userData = userDoc.data();

    // 3. Send message (Skip gateway if it's a website widget contact)
    const isWidget = phoneNumber.startsWith('widget_');
    let responseStatus = 'sent';
    let config = null;

    if (!isWidget) {
      // Real MSG91 logic - Auth is required
      if (!userData?.msg91_authkey || !userData?.msg91_integrated_number) {
        return NextResponse.json({ error: 'MSG91 not configured' }, { status: 400 });
      }

      config = {
        msg91_authkey: decrypt(userData.msg91_authkey),
        msg91_integrated_number: userData.msg91_integrated_number
      };

      try {
        await sendMSG91Reply(phoneNumber, content, config);
        responseStatus = 'sent';
      } catch (error) {
         console.error('MSG91 Send Error:', error);
         responseStatus = 'failed';
      }
    }

    // 4. Record outbound message
    const messageRef = adminDb.collection('chat_messages').doc();
    await messageRef.set({
      ownerId,
      contactPhone: phoneNumber,
      direction: 'outbound',
      sender: 'agent',
      content,
      contentType: 'text',
      source: isWidget ? 'widget' : 'whatsapp',
      status: responseStatus,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    // 5. Update Contact metadata
    // We need to find the correct contact doc for this user/phone
    const contactQuery = await adminDb.collection('contacts')
      .where('ownerId', '==', ownerId)
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (!contactQuery.empty) {
      const contactRef = contactQuery.docs[0].ref;
      await contactRef.update({
        lastMessage: content,
        lastMessageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        unreadCount: 0, // Agent replied, clear unread
      });
    }

    // 6. Update stats for the dashboard
    await incrementMessageStats(ownerId, 'outbound', isWidget ? 'widget' : 'whatsapp');

    return NextResponse.json({ success: true, status: responseStatus });

  } catch (error: any) {
    console.error('API Send Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
