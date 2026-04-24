import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminAuth } from '@/lib/firebase/admin';
import { sendToChatwoot } from '@/lib/chatwoot/api';

export async function POST(req: NextRequest) {
  try {
    // Auth check (same pattern as settings/route.ts)
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decodedToken = await adminAuth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { base_url, api_token, account_id } = await req.json();

    if (!base_url || !api_token) {
      return NextResponse.json({ error: 'Base URL and API Token are required' }, { status: 400 });
    }

    // Clean base URL – strip trailing slash and any path
    const cleanUrl = base_url.trim().replace(/\/$/, '');

    // Step 1: Fetch Profile → get accounts list
    const profile = await sendToChatwoot.getProfile(cleanUrl, api_token);
    const accounts = (profile.accounts || []).map((a: any) => ({
      id: a.id,
      name: a.name,
    }));

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No accounts found for this token' }, { status: 404 });
    }

    // Step 2: Fetch Inboxes for the selected (or first) account
    const targetAccountId = account_id || accounts[0].id;
    const inboxData = await sendToChatwoot.getInboxes(cleanUrl, api_token, targetAccountId);
    const inboxes = (inboxData.payload || inboxData || []).map((ib: any) => ({
      id: ib.id,
      name: ib.name,
      channel_type: ib.channel_type,
    }));

    return NextResponse.json({
      success: true,
      accounts,
      selectedAccountId: targetAccountId,
      inboxes,
    });

  } catch (error: any) {
    console.error('Fetch Chatwoot Error:', error);
    return NextResponse.json({ error: error.message || 'Invalid Base URL or Token' }, { status: 500 });
  }
}
