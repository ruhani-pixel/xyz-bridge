import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendMSG91Reply } from '@/lib/msg91/api';
import { decrypt } from '@/lib/security';
import { FieldValue } from 'firebase-admin/firestore';
import { incrementMessageStats } from '@/lib/firebase/stats-admin';
import { sendToChatwoot } from '@/lib/chatwoot/api';

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

    // 3. Send message (Skip gateway if it's a website widget contact or Test number)
    const isWidget = phoneNumber.startsWith('widget_');
    const isTestNumber = phoneNumber === '910000000000' || phoneNumber === '+910000000000';
    let responseStatus = 'sent';
    let config = null;

    if (isTestNumber) {
      // FORWARD TO CHATWOOT AS INCOMING (Simulate customer message for testing)
      if (userData?.chatwoot_api_token && userData?.chatwoot_account_id) {
        try {
          const chatwootConfig = {
            chatwoot_base_url: userData.chatwoot_base_url || 'https://app.chatwoot.com',
            chatwoot_api_token: decrypt(userData.chatwoot_api_token),
            chatwoot_account_id: userData.chatwoot_account_id,
            chatwoot_inbox_id: userData.chatwoot_inbox_id
          };

          console.log('[TestNumber] Forwarding to Chatwoot as incoming...');
          const result = await sendToChatwoot.forwardInbound(
            '910000000000',
            'Test User (XYZ Bridge)',
            content,
            chatwootConfig
          );
          console.log('[TestNumber] Chatwoot result:', result);

          // Save conversationId for future use
          if (result.conversationId) {
            const contactQuery = await adminDb.collection('contacts')
              .where('ownerId', '==', ownerId)
              .where('phoneNumber', '==', '910000000000')
              .limit(1)
              .get();
            if (!contactQuery.empty) {
              await contactQuery.docs[0].ref.update({ chatwootConversationId: result.conversationId });
            }
          }

          responseStatus = 'sent';
        } catch (cwError: any) {
          console.error('[TestNumber] Chatwoot forwarding FAILED:', cwError.message);
          responseStatus = 'failed';
        }
      } else {
        console.warn('[TestNumber] Chatwoot not configured, skipping forwarding');
      }
    } else if (!isWidget) {
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
