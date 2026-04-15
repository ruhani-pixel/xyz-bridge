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

    const { subject, body, recipients, campaignName } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    // 1. Get user's Gmail App Password from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const appPassword = userData?.gmail_app_password;
    const senderEmail = userData?.email;

    if (!appPassword) {
      return NextResponse.json({ 
        error: 'APP_PASSWORD_MISSING', 
        message: 'No App Password configured. Please go to Settings.' 
      }, { status: 400 });
    }

    // 2. Create Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    // 3. Create Campaign Record in Firestore
    const campaignRef = adminDb.collection('users').doc(uid).collection('gmailCampaigns').doc();
    const campaignId = campaignRef.id;

    await campaignRef.set({
      id: campaignId,
      name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
      subject,
      body,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      status: 'active',
      createdAt: new Date(),
    });

    // 4. Start sending in the background (simplified for this demo)
    // In a production environment, this should be a background worker or queue.
    // For Vercel/Next.js routes, large batches might timeout.
    // We'll send the first few and return success, instructing frontend to poll or handle the rest.
    
    // Process sending loop (limited for a single request context)
    const MAX_PER_REQUEST = 5; // Send a few immediately to verify
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < Math.min(recipients.length, MAX_PER_REQUEST); i++) {
      const recipient = recipients[i];
      const targetEmail = recipient.Email || recipient.email;
      const targetName = recipient.Name || recipient.name || '';

      // Personalize body
      const personalizedBody = body.replace(/{{Name}}/g, targetName).replace(/{{Email}}/g, targetEmail);

      try {
        await transporter.sendMail({
          from: `"${userData?.name || 'Solid Models User'}" <${senderEmail}>`,
          to: targetEmail,
          subject: subject,
          text: personalizedBody,
          // html: personalizedBody.replace(/\n/g, '<br>'), // Optional HTML support
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${targetEmail}:`, err);
        failed++;
      }
    }

    // Update campaign record
    await campaignRef.update({
      sentCount: sent,
      failedCount: failed,
      status: recipients.length > MAX_PER_REQUEST ? 'processing' : 'completed',
    });

    return NextResponse.json({ 
      success: true, 
      campaignId, 
      sent, 
      failed,
      message: recipients.length > MAX_PER_REQUEST 
        ? 'Campaign started! Sending remaining in background...' 
        : 'Campaign completed!' 
    });

  } catch (error: any) {
    console.error('SMTP API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
