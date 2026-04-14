import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;
    const { phoneNumber, name } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Check if contact already exists
    const existingQuery = await adminDb.collection('contacts')
      .where('ownerId', '==', ownerId)
      .where('phoneNumber', '==', phoneNumber)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json({ 
        success: true, 
        contact: { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() },
        alreadyExists: true 
      });
    }

    // Get user data for default AI settings
    const userSnap = await adminDb.collection('users').doc(ownerId).get();
    const userData = userSnap.data() || {};

    const contactData = {
      ownerId,
      phoneNumber,
      name: name || phoneNumber,
      source: 'whatsapp',
      aiEnabled: userData.ai_default_enabled ?? true,
      bridgeEnabled: false,
      lastMessage: '',
      lastMessageAt: null,
      lastInboundAt: null,
      totalMessages: 0,
      unreadCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('contacts').add(contactData);

    return NextResponse.json({ 
      success: true, 
      contact: { id: docRef.id, ...contactData } 
    });
  } catch (error: any) {
    console.error('Create Contact Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
