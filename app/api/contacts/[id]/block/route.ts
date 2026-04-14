import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const { blocked } = await req.json();

    if (typeof blocked !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const contactRef = adminDb.collection('contacts').doc(params.id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contactDoc.data()?.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await contactRef.update({ 
      status: blocked ? 'blocked' : 'active',
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Blocking Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
