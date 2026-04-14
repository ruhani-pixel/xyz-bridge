import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Get user data to find the Tenant ID
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenantId = userData.tenantId || userId;

    // Security Check: Only the Tenant Head can toggle the Master Switch
    // Or if you want agents to be able to do it too, you can remove this check.
    // Given the "70% control" requirement, Head usually handles global settings.
    if (userData.role === 'agent') {
       return NextResponse.json({ error: 'Only the Company Head can toggle the Master AI Pilot.' }, { status: 403 });
    }

    // 2. Update the Tenant's globalAiEnabled flag
    await adminDb.collection('users').doc(userId).update({
       globalAiEnabled: enabled,
       updatedAt: new Date()
    });

    // 3. BULK UPDATE: Toggle AI for all contacts belonging to this tenant
    const contactsQuery = await adminDb.collection('contacts').where('ownerId', '==', userId).get();
    
    const batch = adminDb.batch();
    contactsQuery.docs.forEach((doc) => {
       batch.update(doc.ref, { aiEnabled: enabled, updatedAt: new Date() });
    });
    
    await batch.commit();

    return NextResponse.json({ 
       success: true, 
       message: `Master AI Pilot ${enabled ? 'Engaged' : 'Disengaged'}. Updated ${contactsQuery.size} contacts.` 
    });

  } catch (error: any) {
    console.error('Master AI Toggle Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
