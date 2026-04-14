import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Please login first' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userUid = decodedToken.uid;
    const { inviteId } = await req.json();

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    // 1. Fetch Invitation
    const inviteRef = adminDb.collection('invitations').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 });
    }

    const inviteData = inviteDoc.data()!;
    if (inviteData.status !== 'pending') {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 400 });
    }

    // Check expiry (7 days)
    if (inviteData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    // 2. Link User to Tenant
    const userRef = adminDb.collection('users').doc(userUid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists && userDoc.data()?.tenantId && userDoc.data()?.tenantId !== userUid) {
       // If user is already part of another team
       return NextResponse.json({ error: 'You are already part of another team. Please logout and use a different account.' }, { status: 400 });
    }

    // Update user record
    await userRef.set({
      tenantId: inviteData.tenantId,
      role: 'agent',
      isApproved: true,
      onboardingComplete: true,
      updatedAt: new Date()
    }, { merge: true });

    // 3. Update Invite Status
    await inviteRef.update({
      status: 'accepted',
      acceptedBy: userUid,
      acceptedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the team! You have successfully joined.' 
    });

  } catch (error: any) {
    console.error('Accept Invite Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
