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

    // Load Contact Data early to check for Chatwoot Conversation ID
    const contactQuery = await adminDb.collection('contacts')
      .where('ownerId', '==', ownerId)
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    const contactDoc = contactQuery.empty ? null : contactQuery.docs[0];
    const contactData = contactDoc?.data();

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

          const conversationId = contactData?.chatwootConversationId;
          const isAgentSim = contactData?.isSimulatedCustomer === false;

          if (conversationId) {
            console.log(`[TestNumber] Syncing as ${isAgentSim ? 'AGENT' : 'CUSTOMER'}...`);
            await sendToChatwoot.sendMessage(
              conversationId,
              content,
              isAgentSim ? 'outgoing' : 'incoming',
              chatwootConfig
            );
          } else {
            console.log('[TestNumber] No conversation found, creating new one...');
            const result = await sendToChatwoot.forwardInbound(
              '910000000000',
              'Test User (XYZ Bridge)',
              content,
              chatwootConfig
            );
            
            if (result.conversationId && contactDoc) {
              await contactDoc.ref.update({ 
                chatwootConversationId: result.conversationId,
                chatwootContactId: result.contactId,
                chatwootSourceId: result.sourceId
              });
            }
          }
          responseStatus = 'sent';
        } catch (cwError: any) {
          console.error('[TestNumber] Chatwoot simulation FAILED:', cwError.message);
          responseStatus = 'failed';
        }
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

    // 4. Record outbound message in our database
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
    if (contactDoc) {
      await contactDoc.ref.update({
        lastMessage: content,
        lastMessageAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        unreadCount: 0,
      });
    }

    // 6. Update stats for the dashboard
    await incrementMessageStats(ownerId, 'outbound', isWidget ? 'widget' : 'whatsapp');

    // --- NEW: Sync Real SaaS Dashboard reply to Chatwoot (Only for non-test numbers) ---
    // Test numbers are already handled above as "incoming" simulations
    if (!isTestNumber && !isWidget && responseStatus === 'sent') {
      const isBridgeGlobal = userData?.bridgeEnabled;
      const isBridgeContact = contactData?.bridgeEnabled;
      const conversationId = contactData?.chatwootConversationId;

      if ((isBridgeGlobal || isBridgeContact) && conversationId && userData?.chatwoot_api_token) {
        try {
          const chatwootConfig = {
            chatwoot_base_url: userData.chatwoot_base_url || 'https://app.chatwoot.com',
            chatwoot_api_token: decrypt(userData.chatwoot_api_token),
            chatwoot_account_id: userData.chatwoot_account_id
          };
          
          await sendToChatwoot.sendMessage(
            conversationId,
            content,
            'outgoing', // Real agent reply
            chatwootConfig
          );
          console.log('[Bridge] Synced real SaaS reply to Chatwoot:', conversationId);
        } catch (cwError) {
          console.error('[Bridge] Failed to sync real SaaS reply to Chatwoot:', cwError);
        }
      }
    }

    return NextResponse.json({ success: true, status: responseStatus });

  } catch (error: any) {
    console.error('API Send Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
