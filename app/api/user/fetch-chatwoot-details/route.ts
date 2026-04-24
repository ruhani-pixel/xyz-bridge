import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { sendToChatwoot } from '@/lib/chatwoot/api';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { base_url, api_token } = await req.json();

    if (!base_url || !api_token) {
      return NextResponse.json({ error: 'Base URL and API Token are required' }, { status: 400 });
    }

    // 1. Fetch Profile to get Account ID
    const profile = await sendToChatwoot.getProfile(base_url, api_token);
    
    // Chatwoot profile returns accounts array. We'll take the first one or let the user know.
    const accounts = profile.accounts || [];
    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No accounts found for this token' }, { status: 404 });
    }

    const accountId = accounts[0].id;

    // 2. Fetch Inboxes for this account
    const inboxes = await sendToChatwoot.getInboxes(base_url, api_token, accountId);

    return NextResponse.json({
      success: true,
      accountId,
      inboxes: inboxes.map((ib: any) => ({
        id: ib.id,
        name: ib.name,
        channel_type: ib.channel_type
      }))
    });

  } catch (error: any) {
    console.error('Fetch Chatwoot Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
