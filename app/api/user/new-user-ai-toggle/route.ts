import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only Company Head can change this setting
    if (userData.role === 'agent') {
      return NextResponse.json(
        { error: 'Only the Company Head can change New User AI settings.' },
        { status: 403 }
      );
    }

    // Update ONLY the ai_default_enabled field (does NOT touch existing contacts)
    await adminDb.collection('users').doc(userId).update({
      ai_default_enabled: enabled,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `AI for New Users ${enabled ? 'Enabled' : 'Disabled'}. Future contacts will ${enabled ? '' : 'not '}receive AI replies by default.`,
    });
  } catch (error: any) {
    console.error('New User AI Toggle Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
