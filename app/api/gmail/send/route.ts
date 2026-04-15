import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { subject, body, recipients, campaignName, isTest, testEmail } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      if (!isTest) {
        return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
      }
    }
    
    if (isTest && !testEmail) {
      return NextResponse.json({ error: 'No test email provided' }, { status: 400 });
    }

    // 1. Get user's Gmail App Password from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const appPassword = userData?.gmail_app_password;
    const senderEmail = userData?.gmail_email || userData?.email;

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

    // 3. Create Campaign Record in Firestore (ONLY IF NOT TEST)
    let campaignRef, campaignId;
    
    if (!isTest) {
      campaignRef = adminDb.collection('users').doc(uid).collection('gmailCampaigns').doc();
      campaignId = campaignRef.id;

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
    }

    // 4. Start sending
    // For test, we only want to pick the first recipient to populate tags, and send to testEmail
    const loopLimit = isTest ? 1 : Math.min(recipients.length, 5); 
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < loopLimit; i++) {
      const recipient = recipients[i] || {};
      // If it's a test, force target to testEmail. Otherwise use recipient data.
      const targetEmail = isTest ? testEmail : (recipient.Email || recipient.email);
      const targetName = recipient.Name || recipient.name || (isTest ? 'Test User' : '');

      // Individual recipient Subject/Body override from Advanced CSV
      const rowSubject = recipient.Subject || recipient.subject || subject;
      const rowBody = recipient.Body || recipient.body || body;

      // Personalize body and subject
      const personalizedBody = rowBody.replace(/{{Name}}/g, targetName).replace(/{{Email}}/g, targetEmail);
      const personalizedSubject = rowSubject.replace(/{{Name}}/g, targetName).replace(/{{Email}}/g, targetEmail);

      try {
        await transporter.sendMail({
          from: `"${userData?.name || 'Solid Models User'}" <${senderEmail}>`,
          to: targetEmail,
          subject: personalizedSubject,
          text: personalizedBody,
          // html: personalizedBody.replace(/\n/g, '<br>'), // Optional HTML support
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${targetEmail}:`, err);
        failed++;
      }
    }

    if (!isTest && campaignRef) {
      const isCompletedNow = recipients.length <= 5;
      
      const updateData: any = {
        sentCount: sent,
        failedCount: failed,
        status: isCompletedNow ? 'completed' : 'processing',
      };

      // SCRUB DATA IMMEDIATELY IF VERY SMALL CAMPAIGN
      if (isCompletedNow) {
        updateData.recipients = FieldValue.delete();
        updateData.subject = FieldValue.delete();
        updateData.body = FieldValue.delete();
      }

      await campaignRef.update(updateData);

      // Background processor for large lists
      if (!isCompletedNow) {
        (async () => {
          let bgSent = sent;
          let bgFailed = failed;
          
          for (let i = 5; i < recipients.length; i++) {
            const r = recipients[i] || {};
            const tEmail = r.Email || r.email;
            const tName = r.Name || r.name || '';
            const rSub = r.Subject || r.subject || subject;
            const rBody = r.Body || r.body || body;
            
            const pBody = rBody.replace(/{{Name}}/g, tName).replace(/{{Email}}/g, tEmail);
            const pSub = rSub.replace(/{{Name}}/g, tName).replace(/{{Email}}/g, tEmail);

            try {
              if (tEmail) {
                await transporter.sendMail({
                  from: `"${userData?.name || 'Solid Models User'}" <${senderEmail}>`,
                  to: tEmail,
                  subject: pSub,
                  text: pBody,
                });
                bgSent++;
              }
            } catch (err) { bgFailed++; }

            // Batch update UI tracking every 10 emails
            if (i % 10 === 0) {
              await campaignRef?.update({
                sentCount: bgSent,
                failedCount: bgFailed
              });
            }
            
            // Sleep to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // FINAL SCRUB WHEN BACKGROUND FINISHES
          await campaignRef?.update({
            sentCount: bgSent,
            failedCount: bgFailed,
            status: 'completed',
            recipients: FieldValue.delete(),
            subject: FieldValue.delete(),
            body: FieldValue.delete()
          });
        })();
      }

      // If launched from a specific draft, wipe that draft.
      const { draftId } = await req.json().catch(() => ({}));
      if (draftId) {
        await adminDb.collection('users').doc(uid).collection('gmailDrafts').doc(draftId).delete().catch(() => {});
      }
    }

    if (isTest) {
      return NextResponse.json({ 
        success: sent > 0, 
        message: sent > 0 ? 'Test email sent successfully!' : 'Test email failed to send.' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      campaignId, 
      sent, 
      failed,
      message: recipients.length > 5 
        ? 'Campaign started! Sending remaining in background...' 
        : 'Campaign completed!' 
    });

  } catch (error: any) {
    console.error('SMTP API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
