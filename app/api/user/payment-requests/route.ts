import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies.get('firebase-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        const body = await req.json();
        const amount = Number(body?.amount || 0);
        const gateway = String(body?.gateway || 'payu');

        if (!Number.isFinite(amount) || amount < 99) {
            return NextResponse.json({ error: 'Minimum recharge amount is ₹99' }, { status: 400 });
        }

        const requestRef = adminDb.collection('users').doc(uid).collection('payment_requests').doc();
        const now = new Date();

        await requestRef.set({
            amount,
            currency: 'INR',
            gateway,
            status: 'coming_soon',
            note: 'PayU integration coming soon. Use own API or contact support.',
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            success: true,
            status: 'coming_soon',
            message: 'PayU integration coming soon',
            requestId: requestRef.id,
        });
    } catch (error: any) {
        console.error('Create payment request error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create payment request' }, { status: 500 });
    }
}
