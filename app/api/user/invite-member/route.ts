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
    const ownerUid = decodedToken.uid;

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Check if the inviting user is a Tenant Header (or admin/superadmin)
    const ownerDoc = await adminDb.collection('users').doc(ownerUid).get();
    const ownerData = ownerDoc.data();

    if (!ownerData || (ownerData.role !== 'user' && ownerData.role !== 'admin' && ownerData.role !== 'superadmin')) {
       return NextResponse.json({ error: 'Forbidden: Only company heads can invite members.' }, { status: 403 });
    }

    // Identify the Tenant ID (if owner is tenant, it's their own UID, if they are already an agent, they can't invite)
    const tenantId = ownerData.tenantId || ownerUid;

    // 2. Check if user already exists
    const userQuery = await adminDb.collection('users').where('email', '==', email.toLowerCase()).get();
    
    if (!userQuery.empty) {
       const existingUser = userQuery.docs[0].data();
       if (existingUser.tenantId) {
          return NextResponse.json({ error: 'User is already part of a team.' }, { status: 400 });
       }
       
       // Update existing user to join this team
       await userQuery.docs[0].ref.update({
          tenantId: tenantId,
          invitedBy: ownerUid,
          role: 'agent',
          isApproved: true,
          onboardingComplete: true // Team members don't need onboarding, they use tenant config
       });

       return NextResponse.json({ success: true, message: 'Existing user added to your team.' });
    }

    // 3. Create a unique invite link/document
    const inviteRef = adminDb.collection('invitations').doc();
    await inviteRef.set({
      email: email.toLowerCase(),
      tenantId: tenantId,
      invitedBy: ownerUid,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Note: In a real app, send an email here with the link: `/invite/accept?id=${inviteRef.id}`
    
    return NextResponse.json({ 
       success: true, 
       inviteId: inviteRef.id,
       message: 'Invitation created successfully.' 
    });

  } catch (error: any) {
    console.error('Invite Member Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
