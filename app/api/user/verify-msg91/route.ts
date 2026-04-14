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
      // Parse the error to detect IP blocking (418) or auth failure (401)
      let errorType = 'auth_failed';
      let userMessage = 'Auth Key galat hai ya expire ho gayi hai. MSG91 Dashboard se nayi key generate karein.';
      
      try {
        const errData = typeof result.error === 'string' ? JSON.parse(result.error) : result.error;
        if (errData?.apiError === '418' || errData?.code === '418') {
          errorType = 'ip_blocked';
          userMessage = 'MSG91 ne aapke server ka IP block kar diya hai. API Security OFF karein ya IP whitelist karein.';
        } else if (errData?.code === '401' || errData?.errors === 'Unauthorized') {
          errorType = 'auth_failed';
          userMessage = 'Auth Key sahi nahi hai. MSG91 Dashboard se check karein.';
        }
      } catch {
        // if error string contains 418
        if (typeof result.error === 'string' && result.error.includes('418')) {
          errorType = 'ip_blocked';
          userMessage = 'MSG91 ne aapke server ka IP block kar diya hai. API Security OFF karein ya IP whitelist karein.';
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        error_type: errorType,
        error: userMessage
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify MSG91 Error:', error);
    return NextResponse.json({ 
      success: false,
      error_type: 'auth_failed',
      error: 'Server se connection nahi ho paya. Thodi der baad try karein.' 
    }, { status: 500 });
  }
}
