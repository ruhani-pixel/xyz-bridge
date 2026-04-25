import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

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

    // 2. Delete the contact document
    batch.delete(contactRef);

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Contact and conversation deleted' });
  } catch (error: any) {
    console.error('Delete Contact Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const contactRef = adminDb.collection('contacts').doc(params.id);
    
    // Basic update (In a real app, we'd verify the ownerId here)
    await contactRef.update({
      ...body,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Contact Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
