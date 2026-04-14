import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const contactId = params.id;

  try {
    const contactRef = adminDb.collection('contacts').doc(contactId);
    const contactSnap = await contactRef.get();

    if (!contactSnap.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactData = contactSnap.data()!;
    const contactPhone = contactData.phoneNumber;
    const ownerId = contactData.ownerId;

    // 1. Delete all messages for this contact (Batched)
    const messagesQuery = await adminDb.collection('chat_messages')
      .where('ownerId', '==', ownerId)
      .where('contactPhone', '==', contactPhone)
      .get();

    const batch = adminDb.batch();
    messagesQuery.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 2. Reset contact metadata (Keep the contact doc)
    batch.update(contactRef, {
      lastMessage: 'Conversation cleared',
      unreadCount: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Conversation cleared' });
  } catch (error: any) {
    console.error('Clear Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
