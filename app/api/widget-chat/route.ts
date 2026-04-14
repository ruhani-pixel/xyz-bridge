import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateAIResponse } from '@/lib/ai/service';
import { incrementMessageStats } from '@/lib/firebase/stats-admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST: Receive a message from the website widget
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, visitorId, visitorName, message } = body;

    if (!tenantId || !message) {
      return NextResponse.json({ error: 'Missing tenantId or message' }, { status: 400, headers: corsHeaders });
    }

    // Generate or use visitor ID
    const finalVisitorId = visitorId || `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const contactPhone = `widget_${finalVisitorId}`;

    // Check tenant exists
    const tenantDoc = await adminDb.collection('users').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 404, headers: corsHeaders });
    }

    // Find or create contact for this widget visitor
    const contactQuery = await adminDb.collection('contacts')
      .where('ownerId', '==', tenantId)
      .where('phoneNumber', '==', contactPhone)
      .limit(1)
      .get();

    let contactRef;
    if (contactQuery.empty) {
      // Create new contact tagged as website visitor
      contactRef = adminDb.collection('contacts').doc();
      await contactRef.set({
        ownerId: tenantId,
        phoneNumber: contactPhone,
        name: visitorName || 'Website Visitor',
        source: 'widget',
        aiEnabled: true,
        bridgeEnabled: false,
        lastMessage: message,
        totalMessages: 1,
        unreadCount: 1,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
        lastInboundAt: FieldValue.serverTimestamp(),
      });
    } else {
      contactRef = contactQuery.docs[0].ref;
      await contactRef.update({
        source: 'widget', // Ensure tag exists even for returning visitors
        lastMessage: message,
        totalMessages: FieldValue.increment(1),
        unreadCount: FieldValue.increment(1),
        lastMessageAt: FieldValue.serverTimestamp(),
        lastInboundAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Save message
    await adminDb.collection('chat_messages').add({
      ownerId: tenantId,
      contactPhone,
      direction: 'inbound',
      sender: 'user',
      content: message,
      contentType: 'text',
      source: 'widget',
      status: 'received',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Increment tenant message count and update stats
    await incrementMessageStats(tenantId, 'inbound', 'widget');

    // 4. Activity Log (Non-blocking)
    const logRef = adminDb.collection('webhookLogs').doc();
    await logRef.set({
      ownerId: tenantId,
      source: 'website',
      event: 'INBOUND_MESSAGE_RECEIVED',
      details: `Message from visitor ${visitorName || 'Unknown'} (${finalVisitorId})`,
      processingStatus: 'success',
      processingTimeMs: 0,
      timestamp: FieldValue.serverTimestamp(),
    });

    // --- AI AUTO-REPLY (If AI is ON) ---
    const contactData = (await contactRef.get()).data()!;
    if (contactData.aiEnabled !== false) {
      try {
        // --- NEW: Signal AI is typing ---
        await contactRef.update({ 
          isTyping: true,
          aiError: null 
        });

        // Direct call to AI Service (No internal HTTP fetch required)
        const reply = await generateAIResponse(tenantId, contactPhone, message);

        if (reply) {
          await adminDb.collection('chat_messages').add({
            ownerId: tenantId,
            contactPhone,
            direction: 'outbound',
            sender: 'ai',
            content: reply,
            contentType: 'text',
            source: 'widget',
            status: 'sent',
            timestamp: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          });

          await adminDb.collection('contacts').doc(contactRef.id).update({
             lastMessage: reply,
             lastMessageAt: FieldValue.serverTimestamp(),
             isTyping: false // Done typing
          });

          // Update Outbound Stats for the dashboard
          await incrementMessageStats(tenantId, 'outbound', 'widget');

          // Log AI Reply
          await adminDb.collection('webhookLogs').add({
            ownerId: tenantId,
            source: 'website',
            event: 'AI_REPLY_SENT',
            details: `AI Response to ${finalVisitorId}`,
            processingStatus: 'success',
            processingTimeMs: 0,
            timestamp: FieldValue.serverTimestamp(),
          });
        } else {
          await contactRef.update({ isTyping: false });
        }
      } catch (aiErr: any) {
        console.error('Widget AI Auto-reply failed:', aiErr);
        // --- NEW: Report error to UI ---
        await contactRef.update({ 
          isTyping: false,
          aiError: aiErr.message || 'AI generation failed due to an internal error.'
        });
      }
    }

    return NextResponse.json({ 
      status: 'ok', 
      visitorId: finalVisitorId,
      contactId: contactRef.id
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Widget chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: corsHeaders });
  }
}

// GET: Fetch chat history for a widget visitor
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const visitorId = searchParams.get('visitorId');

  if (!tenantId || !visitorId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400, headers: corsHeaders });
  }

  const contactPhone = `widget_${visitorId}`;

  try {
    let messagesSnap;
    try {
      messagesSnap = await adminDb.collection('chat_messages')
        .where('ownerId', '==', tenantId)
        .where('contactPhone', '==', contactPhone)
        .orderBy('timestamp', 'asc')
        .limit(50)
        .get();
    } catch (indexErr) {
      console.warn('Index missing, falling back to manual sort:', indexErr);
      // Fallback: Fetch without orderBy and sort in memory
      messagesSnap = await adminDb.collection('chat_messages')
        .where('ownerId', '==', tenantId)
        .where('contactPhone', '==', contactPhone)
        .limit(50)
        .get();
    }

    const messages = messagesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
    }));

    // Manual sort if needed (ensure stable order even if index is missing)
    messages.sort((a: any, b: any) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

    return NextResponse.json({ messages }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Widget history error:', error);
    return NextResponse.json({ messages: [] }, { headers: corsHeaders });
  }
}
