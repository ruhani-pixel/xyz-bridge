import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { syncPricingFromLiteLLM } from '@/lib/ai/pricing-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);

    const result = await syncPricingFromLiteLLM();
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Pricing synchronized successfully!', pricing: result.pricing });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Manual Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
