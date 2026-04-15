import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { appPassword } = await req.json();

    if (!appPassword) {
      return NextResponse.json({ error: 'App Password is required' }, { status: 400 });
    }

    // Get user email
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const senderEmail = userData?.email;

    if (!senderEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Attempt to verify SMTP connection
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    try {
      await transporter.verify();
      
      // If verification succeeds, we can optionally save it here too,
      // but the Settings page handles the main save.
      
      return NextResponse.json({ success: true, message: 'SMTP connection successful!' });
    } catch (err: any) {
      console.error('SMTP Verification Failed:', err);
      let errorMessage = 'Connection failed. Please check your App Password and try again.';
      
      if (err.message.includes('Invalid login')) {
        errorMessage = 'Invalid login. Apne App Password ko check karein.';
      } else if (err.message.includes('EAI_AGAIN')) {
        errorMessage = 'DNS/Network error. Please try again later.';
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
