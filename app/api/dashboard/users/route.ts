import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken, getUserRole } from '@/lib/firebase/auth';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  const decoded = await verifyIdToken(token || '');
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = await getUserRole(decoded.uid);
  if (currentUser?.role !== 'superadmin' && currentUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  const decoded = await verifyIdToken(token || '');
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentUser = await getUserRole(decoded.uid);
  if (currentUser?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden. Superadmin only.' }, { status: 403 });
  }

  try {
    const { uid, role, isApproved } = await req.json();
    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });

    const updateData: any = {};
    if (role !== undefined) {
      if (!['viewer', 'agent', 'admin', 'superadmin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    await adminDb.collection('users').doc(uid).update(updateData);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
