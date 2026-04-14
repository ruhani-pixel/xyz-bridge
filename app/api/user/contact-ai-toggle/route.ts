import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export async function PATCH(req: NextRequest) {
  try {
    const { contactId, aiEnabled } = await req.json();

    if (!contactId) {
       return NextResponse.json({ error: 'Missing contact ID' }, { status: 400 });
    }

    const contactRef = doc(db, 'contacts', contactId);
    await updateDoc(contactRef, {
       aiEnabled: Boolean(aiEnabled)
    });

    return NextResponse.json({ success: true, aiEnabled });
  } catch (error: any) {
    console.error('Contact AI Toggle Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
