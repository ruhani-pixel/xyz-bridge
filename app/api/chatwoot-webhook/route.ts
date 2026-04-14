import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendMSG91Reply } from '@/lib/msg91/api';
import { FieldValue } from 'firebase-admin/firestore';
import { incrementStats, getSystemConfig } from '@/lib/firebase-queries';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // CRITICAL: Only process outgoing agent messages
    if (payload.event !== 'message_created') return NextResponse.json({ ok: true });
    if (payload.message_type !== 'outgoing') return NextResponse.json({ ok: true });
    if (payload.private === true) return NextResponse.json({ ok: true }); // Skip private notes
    if (payload.sender?.type === 'agent_bot') return NextResponse.json({ ok: true });

    const conversationId = payload.conversation?.id;
    const content = payload.content;

    if (!conversationId || !content) return NextResponse.json({ ok: true });

    // Find contact and ownerId from conversation ID
    const contactsRef = adminDb.collection('contacts');
    const q = await contactsRef.where('chatwootConversationId', '==', conversationId).limit(1).get();

    if (q.empty) {
      console.error('No contact found for conversationId:', conversationId);
      return NextResponse.json({ ok: true });
    }

    const contactDoc = q.docs[0];
    const contact = contactDoc.data();
    const ownerId = contact.ownerId; // The tenant who owns this conversation

    // Get user-specific config
    const userDoc = await adminDb.collection('users').doc(ownerId).get();
    if (!userDoc.exists) {
      console.error('Owner not found for conversation:', conversationId);
      return NextResponse.json({ ok: true });
    }
    
    const userData = userDoc.data()!;
    const config = {
      msg91_authkey: decrypt(userData.msg91_authkey),
      integrated_number: userData.msg91_integrated_number
    };

    let responseStatus = 'sent';

    try {
      // Send reply via MSG91
      await sendMSG91Reply(contact.phoneNumber, content, { authkey: config.msg91_authkey });
      
      // Update individual user stats
      const statsRef = adminDb.collection('users').doc(ownerId).collection('stats').doc('realtime');
      await statsRef.set({
        totalOutbound: FieldValue.increment(1),
        lastActivityAt: FieldValue.serverTimestamp(),
      }, { merge: true });

    } catch (err: any) {
      console.error('Failed to send MSG91 reply:', err);
      responseStatus = 'failed';
    }

    // Save outbound message (V2 schema: chat_messages)
    await adminDb.collection('chat_messages').add({
      ownerId,
      contactPhone: contact.phoneNumber,
      direction: 'outbound',
      sender: 'agent',
      content,
      contentType: 'text',
      chatwootConversationId: conversationId,
      status: responseStatus,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Chatwoot webhook error:', error);
    return NextResponse.json({ ok: true }); // Always 200
  }
}

import { decrypt } from '@/lib/security';
