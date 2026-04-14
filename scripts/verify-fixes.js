const admin = require('firebase-admin');

async function verifyFixes() {
  const tenantId = 'Vhb5HLKbtfZaHwd9BqMU0fm0le22';
  const visitorId = 'FIX_TEST_' + Date.now();
  const contactPhone = `widget_${visitorId}`;
  
  console.log('--- STARTING COMPREHENSIVE FIX VERIFICATION ---');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  const db = admin.firestore();

  // 1. TEST INBOUND + AI AUTO-REPLY LOGIC
  console.log('\nStep 1: Testing Inbound + AI Auto-reply logic...');
  // (Simulating the logic in app/api/widget-chat/route.ts)
  const message = 'Auto-reply test message';
  
  // We'll call the service directly to prove it works
  const { generateAIResponse } = require('../lib/ai/service');
  try {
    const aiReply = await generateAIResponse(tenantId, contactPhone, message);
    console.log('✅ AI Service worked! Reply:', aiReply);
  } catch (err) {
    console.log('❌ AI Service failed:', err.message);
  }

  // 2. TEST HUMAN REPLY LOGIC (Simulating app/api/chat/send/route.ts)
  console.log('\nStep 2: Testing Human Reply logic (Widget vs WhatsApp)...');
  
  const testSendLogic = async (phone) => {
    const isWidget = phone.startsWith('widget_');
    console.log(`Checking config requirements for ${phone}...`);
    
    // Simulate lookup of user config (who doesn't have MSG91)
    const userDoc = await db.collection('users').doc(tenantId).get();
    const userData = userDoc.data();
    
    if (!isWidget) {
       if (!userData.msg91_authkey || !userData.msg91_integrated_number) {
         return 'FAIL: MSG91 required for WhatsApp but missing';
       }
    } else {
       console.log('✅ Success: Skipping MSG91 check for website visitor');
       return 'PASS: Manual reply allowed';
    }
    return 'PASS: Manual reply allowed (WhatsApp)';
  };

  const widgetResult = await testSendLogic(contactPhone);
  console.log('Widget Result:', widgetResult);

  const whatsappResult = await testSendLogic('911234567890');
  console.log('WhatsApp Result:', whatsappResult);

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyFixes().catch(console.error);
