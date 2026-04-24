import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateAIResponse } from '@/lib/ai/service';
import { incrementMessageStats } from '@/lib/firebase/stats-admin';
import { decrypt } from '@/lib/security';
import { sendMSG91Reply } from '@/lib/msg91/api';
import { sendToChatwoot } from '@/lib/chatwoot/api';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let payload: any = {};

  try {
    payload = await req.json();

    // 1. Robust Metadata Extraction
    // MSG91 sometimes sends keys in different casing or stringified
    const integratedNumber = payload.integratedNumber || payload.integrated_number;
    const customerNumber = payload.customerNumber || payload.customer_number;
    const messageId = payload.messageId || payload.requestId || payload.id;
    const direction = typeof payload.direction === 'number' ? payload.direction : (payload.direction === 'inbound' ? 0 : 1);

    // Only process inbound messages (direction 0)
    if (direction !== 0) {
      return NextResponse.json({ status: 'ok', skipped: true });
    }

    if (!integratedNumber || !customerNumber) {
      console.error('Incomplete MSG91 Webhook Payload:', payload);
      return NextResponse.json({ status: 'error', message: 'Missing identifiers' });
    }

    // 2. Find matching tenant/user for this number
    const userQuery = await adminDb.collection('users')
      .where('msg91_integrated_number', '==', integratedNumber)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.error(`No tenant found for MSG91 number: ${integratedNumber}`);
      return NextResponse.json({ status: 'error', message: 'Tenant not found' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const ownerId = userDoc.id;

    // 3. IDEMPOTENCY CHECK (Prevent duplicate processing from retries)
    if (messageId) {
      const existingMsg = await adminDb.collection('chat_messages')
        .where('ownerId', '==', ownerId)
        .where('msg91MessageId', '==', messageId)
        .limit(1)
        .get();
      
      if (!existingMsg.empty) {
        return NextResponse.json({ status: 'ok', message: 'Already processed' });
      }
    }

    // 4. Content Parsing (Universal Parser)
    let messageText = payload.text || '';
    
    // Check for Interactive/Button replies
    if (!messageText && payload.type === 'interactive' && payload.interactive) {
       const interactive = typeof payload.interactive === 'string' ? JSON.parse(payload.interactive) : payload.interactive;
       if (interactive.type === 'button_reply') {
         messageText = interactive.button_reply?.title || '';
       } else if (interactive.type === 'list_reply') {
         messageText = interactive.list_reply?.title || '';
       }
    }

    if (!messageText && payload.content) {
      try {
        const contentObj = typeof payload.content === 'string' ? JSON.parse(payload.content) : payload.content;
        messageText = contentObj.text || contentObj.message || contentObj.button_reply?.title || '';
      } catch (e) {
        messageText = String(payload.content);
      }
    }

    let contactName = customerNumber;
    if (payload.contacts) {
       try {
         const contactsArr = typeof payload.contacts === 'string' ? JSON.parse(payload.contacts) : payload.contacts;
         contactName = contactsArr[0]?.profile?.name || customerNumber;
       } catch (e) {}
    }

    // 5. Subscription & Limits Check
    const messageLimit = userData.messageLimit || 100;
    const currentCount = userData.messageCount || 0;
    const planStatus = userData.planStatus || 'active';

    if (planStatus !== 'active' || currentCount >= messageLimit) {
      return NextResponse.json({ status: 'error', message: 'Limit reached' });
    }

    // 6. DB Operations (Atomic Transaction)
    const contactRef = adminDb.collection('contacts')
      .where('ownerId', '==', ownerId)
      .where('phoneNumber', '==', customerNumber)
      .limit(1);

    let finalContactRef: any;
    let contactData: any;

    const contactSnap = await contactRef.get();

    if (!contactSnap.empty) {
      finalContactRef = contactSnap.docs[0].ref;
      contactData = contactSnap.docs[0].data();
    }

    await adminDb.runTransaction(async (transaction) => {
      if (finalContactRef) {
        transaction.update(finalContactRef, {
           lastMessage: messageText,
           lastMessageAt: FieldValue.serverTimestamp(),
           lastInboundAt: FieldValue.serverTimestamp(),
           updatedAt: FieldValue.serverTimestamp(),
           unreadCount: FieldValue.increment(1),
        });
      } else {
        const newRef = adminDb.collection('contacts').doc();
        finalContactRef = newRef;
        contactData = {
          ownerId,
          phoneNumber: customerNumber,
          name: contactName,
          aiEnabled: userData.ai_default_enabled ?? true,
          unreadCount: 1,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastMessage: messageText,
          lastMessageAt: FieldValue.serverTimestamp(),
          lastInboundAt: FieldValue.serverTimestamp(),
        };
        transaction.set(newRef, contactData);
      }

      // Record Message
      const messageRef = adminDb.collection('chat_messages').doc();
      transaction.set(messageRef, {
        ownerId,
        contactPhone: customerNumber,
        direction: 'inbound',
        sender: 'user',
        content: messageText,
        contentType: 'text',
        source: 'whatsapp',
        status: 'received',
        msg91MessageId: messageId,
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update stats for the dashboard
      await incrementMessageStats(ownerId, 'inbound', 'whatsapp');
    });

    // --- BRIDGE MODE: Forward to Chatwoot ---
    if (userData.bridgeEnabled) {
      try {
        const chatwootConfig = {
          chatwoot_base_url: userData.chatwoot_base_url,
          chatwoot_api_token: decrypt(userData.chatwoot_api_token),
          chatwoot_account_id: userData.chatwoot_account_id,
          chatwoot_inbox_id: userData.chatwoot_inbox_id
        };

        if (chatwootConfig.chatwoot_api_token && chatwootConfig.chatwoot_account_id) {
          let chatwootConversationId = contactData?.chatwootConversationId;
          
          if (!chatwootConversationId) {
            const cwData = await sendToChatwoot.createContactAndConversation(
              customerNumber, 
              contactName, 
              chatwootConfig
            );
            chatwootConversationId = cwData.conversationId;
            
            await finalContactRef.update({
              chatwootConversationId: cwData.conversationId,
              chatwootContactId: cwData.contactId,
              chatwootSourceId: cwData.sourceId,
            });
          }

          await sendToChatwoot.sendMessage(
            chatwootConversationId,
            messageText,
            'incoming',
            chatwootConfig
          );
        }
      } catch (cwError) {
        console.error('Chatwoot forwarding failed:', cwError);
      }
    }

    // --- PLATFORM MODE: AI Auto-Reply ---
    if (userData.platformEnabled && contactData?.aiEnabled !== false) {
      try {
        // --- NEW: Signal AI is typing ---
        await finalContactRef.update({ 
          isTyping: true,
          aiError: null 
        });

        const reply = await generateAIResponse(ownerId, customerNumber, messageText);
        
        if (reply) {
          const config = {
            msg91_authkey: decrypt(userData.msg91_authkey),
            msg91_integrated_number: userData.msg91_integrated_number
          };

          await sendMSG91Reply(customerNumber, reply, config);

          await adminDb.collection('chat_messages').add({
            ownerId,
            contactPhone: customerNumber,
            direction: 'outbound',
            sender: 'ai',
            content: reply,
            contentType: 'text',
            status: 'sent',
            timestamp: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          });

          // Update stats for the dashboard
          await incrementMessageStats(ownerId, 'outbound', 'whatsapp');

          await finalContactRef.update({
            lastMessage: reply,
            lastMessageAt: FieldValue.serverTimestamp(),
            isTyping: false // Done typing
          });
        } else {
          await finalContactRef.update({ isTyping: false });
        }
      } catch (aiError: any) {
        console.error('AI Auto-reply failed:', aiError);
        // --- NEW: Report error to UI ---
        await finalContactRef.update({ 
          isTyping: false,
          aiError: aiError.message || 'AI generation failed due to an internal error.'
        });
      }
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 200 });
  }
}

// End of file
