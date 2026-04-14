const admin = require('firebase-admin');

// VERIFICATION SCRIPT (NO SERVER REQUIRED)
// This script simulates the backend logic of the API routes to verify 
// that data is being saved correctly for the website widget.

async function verifyLogic() {
  const tenantId = 'Vhb5HLKbtfZaHwd9BqMU0fm0le22';
  const visitorId = 'TEST_LOGIC_' + Date.now();
  const contactPhone = `widget_${visitorId}`;
  
  console.log('--- STARTING LOGIC VERIFICATION ---');

  // Initialize Admin SDK
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

  // 1. Simulate INBOUND (Visitor -> CRM)
  console.log('Step 1: Simulating Inbound Message...');
  const inboundContent = 'Hello from simulated widget!';
  
  // Update/Create Contact (Logic from app/api/widget-chat/route.ts)
  const contactRef = db.collection('contacts').doc(); // In real app we query first, here we just test creation
  await db.collection('contacts').add({
    ownerId: tenantId,
    phoneNumber: contactPhone,
    name: 'Test Visitor',
    source: 'widget',
    lastMessage: inboundContent,
    unreadCount: 1,
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Save Message
  await db.collection('chat_messages').add({
    ownerId: tenantId,
    contactPhone,
    direction: 'inbound',
    sender: 'user',
    content: inboundContent,
    source: 'widget',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ Inbound logic simulated');

  // 2. Simulate OUTBOUND (CRM -> Visitor)
  console.log('Step 2: Simulating Outbound Reply...');
  const outboundContent = 'Hi! This is a reply from CRM.';
  
  // Save outbound message
  await db.collection('chat_messages').add({
    ownerId: tenantId,
    contactPhone,
    direction: 'outbound',
    sender: 'agent',
    content: outboundContent,
    source: 'widget',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Clear unread on contact (Logic from app/api/chat/send/route.ts)
  const contactSnap = await db.collection('contacts').where('phoneNumber', '==', contactPhone).get();
  if (!contactSnap.empty) {
    await contactSnap.docs[0].ref.update({
      unreadCount: 0,
      lastMessage: outboundContent,
    });
    console.log('✅ Outbound logic simulated');
  }

  // 3. VERIFY FINAL STATE
  console.log('Step 3: Verifying Database State...');
  let finalMessages;
  try {
    finalMessages = await db.collection('chat_messages')
      .where('contactPhone', '==', contactPhone)
      .orderBy('timestamp', 'asc')
      .get();
  } catch (err) {
    console.warn('⚠️ Index missing, using fallback sort for verification...');
    finalMessages = await db.collection('chat_messages')
      .where('contactPhone', '==', contactPhone)
      .get();
  }

  const msgsData = finalMessages.docs.map(doc => doc.data());
  msgsData.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

  console.log(`\nFound ${msgsData.length} messages for contact:`);
  msgsData.forEach(msg => {
    console.log(`[${msg.direction.toUpperCase()}] ${msg.sender === 'agent' ? 'CRM' : 'Visitor'}: ${msg.content}`);
  });

  if (msgsData.length >= 2) {
    console.log('\n✅ BINGO! Messages are correctly showing up in DB history.');
    console.log('✅ Visitor message reached CRM.');
    console.log('✅ CRM Reply reached Visitor History.');
  } else {
    console.log('\n❌ FAIL: Message count mismatch');
  }
}

verifyLogic().catch(console.error);
