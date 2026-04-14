import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { syncPricingFromLiteLLM } from '@/lib/ai/pricing-sync';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const statsRef = adminDb.collection('users').doc(uid).collection('ai_stats');
    
    // 1. Fetch Total
    const totalDoc = await statsRef.doc('all_time').get();
    const total = totalDoc.data() || { 
      totalCost: 0, 
      totalInput: 0, 
      totalOutput: 0,
      inputCostTotal: 0,
      outputCostTotal: 0
    };

    // 2. Fetch Today's Daily
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const todayDoc = await statsRef.doc(`daily_${dateStr}`).get();
    const today = todayDoc.data() || { 
      cost: 0, 
      input: 0, 
      output: 0,
      inputCost: 0,
      outputCost: 0
    };

    // 3. Fetch History (7/30 days)
    const last30Docs = await statsRef
      .where('date', '<=', dateStr)
      .orderBy('date', 'desc')
      .limit(30)
      .get();
    
    let last7Total = 0;
    let last30Total = 0;
    let idx = 0;
    last30Docs.forEach(doc => {
      const c = doc.data().cost || 0;
      last30Total += c;
      if (idx < 7) last7Total += c;
      idx++;
    });

    // 4. Fetch Hourly (Last 1h)
    const hourlyDoc = await statsRef.doc(`hourly_${dateStr}`).get();
    const hourlyData = hourlyDoc.data() || {};
    const last1h = hourlyData[`h${now.getHours()}`] || 0;

    // 5. Fetch Dynamic Pricing from System Config
    const configDoc = await adminDb.collection('system').doc('config').get();
    const configData = configDoc.data() || {};
    const pricing = configData.ai_pricing || {};
    const lastSynced = configData.lastSynced || null;

    // 6. Auto-Sync Logic (If older than 24 hours)
    if (!lastSynced || (Date.now() - new Date(lastSynced).getTime() > 24 * 60 * 60 * 1000)) {
       // Background trigger (non-blocking)
       syncPricingFromLiteLLM().catch(console.error);
    }

    return NextResponse.json({
      last1h,
      today: today.cost,
      last7: last7Total,
      last30: last30Total,
      allTime: total.totalCost,
      pricing,
      lastSynced,
      breakdown: {
        inputCostToday: today.inputCost || 0,
        outputCostToday: today.outputCost || 0,
        inputTokensToday: today.input || 0,
        outputTokensToday: today.output || 0,
        totalInput: total.totalInput || 0,
        totalOutput: total.totalOutput || 0
      }
    });

  } catch (error: any) {
    console.error('Fetch Billing Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
