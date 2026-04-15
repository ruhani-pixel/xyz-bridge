import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const ownerId = decodedToken.uid;

    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const contactRef = adminDb.collection('contacts').doc(params.id);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contactDoc.data()?.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validation: allow AI ON when user has either own API mode with key,
    // or SaaS AI mode enabled.
    if (enabled) {
      const userDoc = await adminDb.collection('users').doc(ownerId).get();
      const userData = userDoc.data();

      const sourceMode = userData?.ai_source_mode || 'saas_ai';
      const hasOwnKey = !!(userData?.ai_api_key && String(userData.ai_api_key).trim());
      const saasEnabled = userData?.ai_saas_enabled !== false;

      const canEnable = sourceMode === 'saas_ai'
        ? saasEnabled
        : hasOwnKey;

      if (!canEnable) {
        return NextResponse.json({
          error: 'AI Setup Missing',
          message: sourceMode === 'saas_ai'
            ? 'SaaS AI inactive hai ya wallet setup missing hai. AI Setup page me SaaS AI ON karke retry karein.'
            : 'Bhai, pehle Settings mein jaakar AI API Key (OpenAI ya Gemini) set karein tabhi AI ON kar sakte hain.'
        }, { status: 400 });
      }
    }

    await contactRef.update({
      aiEnabled: enabled,
      updatedAt: new Date(),
      // Reset error state if turning ON/OFF
      aiError: null,
      isTyping: false
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('AI Toggle Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
