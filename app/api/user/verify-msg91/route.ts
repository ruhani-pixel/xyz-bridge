import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { verifyMSG91 } from '@/lib/msg91/api';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authkey } = await req.json();

    if (!authkey) {
      return NextResponse.json({ error: 'AuthKey is required' }, { status: 400 });
    }

    const result = await verifyMSG91(authkey);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Connection Successful!',
        balance: result.balance 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Check your AuthKey and try again.' 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify MSG91 Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
