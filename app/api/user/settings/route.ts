import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token).catch(err => {
      console.error('Verify Token Error:', err);
      return null;
    });

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userUid = decodedToken.uid;
    const userDoc = await adminDb.collection('users').doc(userUid).get();
    
    if (!userDoc.exists) {
      // Create a default doc if it doesn't exist to prevent 404/500 loops
      await adminDb.collection('users').doc(userUid).set({
        createdAt: new Date(),
        ownerId: userUid
      });
      return NextResponse.json({ config: {} });
    }

    const data = userDoc.data() || {};
    
    const config = {
      msg91_authkey: data.msg91_authkey || '',
      msg91_integrated_number: data.msg91_integrated_number || '',
      chatwoot_base_url: data.chatwoot_base_url || 'https://app.chatwoot.com',
      chatwoot_api_token: data.chatwoot_api_token || '',
      chatwoot_account_id: data.chatwoot_account_id || '',
      chatwoot_inbox_id: data.chatwoot_inbox_id || '',
      gmail_email: data.gmail_email || '',
      gmail_app_password: data.gmail_app_password || '',
      accountType: data.accountType || 'platform',
    };

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('SERVER_ERROR [GET /api/user/settings]:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      code: error.code || 'UNKNOWN' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userUid = decodedToken.uid;
    const body = await req.json();

    const { 
      msg91_authkey, 
      msg91_integrated_number, 
      chatwoot_base_url, 
      chatwoot_api_token, 
      chatwoot_account_id, 
      chatwoot_inbox_id,
      gmail_email,
      gmail_app_password,
      accountType,
    } = body;

    const updateData: any = {
      msg91_authkey: msg91_authkey || '',
      msg91_integrated_number: msg91_integrated_number || '',
      chatwoot_base_url: chatwoot_base_url || 'https://app.chatwoot.com',
      chatwoot_api_token: chatwoot_api_token || '',
      chatwoot_account_id: chatwoot_account_id || '',
      chatwoot_inbox_id: chatwoot_inbox_id || '',
      accountType: accountType || 'platform',
      updatedAt: new Date(),
    };
    // Only update Gmail fields if they were explicitly provided
    if (gmail_email !== undefined) updateData.gmail_email = gmail_email;
    if (gmail_app_password !== undefined) updateData.gmail_app_password = gmail_app_password;

    await adminDb.collection('users').doc(userUid).update(updateData);

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Update Settings Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
