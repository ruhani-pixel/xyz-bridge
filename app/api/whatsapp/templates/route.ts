import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getMSG91Templates } from '@/lib/msg91/api';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(ownerId).get();
    if (!userDoc.exists) throw new Error('User settings not found');
    const userData = userDoc.data()!;

    if (!userData.msg91_authkey || !userData.msg91_integrated_number) {
      return NextResponse.json({ templates: [] }); // Not configured
    }

    const templatesResponse = await getMSG91Templates(
      userData.msg91_integrated_number,
      userData.msg91_authkey // Plain text
    );

    // Check if MSG91 returned an error (418 IP block, 401 auth, etc.)
    if (templatesResponse?.status === 'fail' || templatesResponse?.hasError) {
      let errorType = 'auth_failed';
      if (templatesResponse?.apiError === '418' || templatesResponse?.code === '418') {
        errorType = 'ip_blocked';
      }
      return NextResponse.json({ 
        templates: [], 
        error_type: errorType,
        error: errorType === 'ip_blocked' 
          ? 'MSG91 API Security ne request block kar di. IP whitelist karein ya API Security OFF karein.'
          : 'Auth Key sahi nahi hai ya expire ho gayi hai.'
      });
    }

    // MSG91 returns an array under 'data', 'templates', or root
    const templates = templatesResponse.data || templatesResponse.templates || (Array.isArray(templatesResponse) ? templatesResponse : []);
    
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Fetch Templates Error:', error);
    
    // Detect 418 in error message
    let errorType = 'auth_failed';
    if (error.message?.includes('418')) {
      errorType = 'ip_blocked';
    }
    
    return NextResponse.json({ 
      templates: [],
      error_type: errorType,
      error: error.message 
    });
  }
}
