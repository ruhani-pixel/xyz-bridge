import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

// GET: Fetch all campaigns for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const snapshot = await adminDb
      .collection('users').doc(uid)
      .collection('gmailCampaigns')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const campaigns = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || 'Untitled',
        subject: d.subject || '',
        totalRecipients: d.totalRecipients || 0,
        sentCount: d.sentCount || 0,
        failedCount: d.failedCount || 0,
        status: d.status || 'completed',
        createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Compute aggregate stats (cumulative, never decreases)
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.failedCount || 0), 0);
    const totalRecipients = campaigns.reduce((sum, c) => sum + (c.totalRecipients || 0), 0);

    return NextResponse.json({ campaigns, stats: { totalSent, totalFailed, totalRecipients, totalCampaigns: campaigns.length } });
  } catch (err: any) {
    console.error('GET /api/gmail/campaigns error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
