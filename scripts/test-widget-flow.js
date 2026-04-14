const admin = require('firebase-admin');
const fetch = require('node-fetch');

// This script simulates a message from the terminal as requested by the user
// and then checks the Firestore database to see if the contact and message were created correctly.

async function testWidgetFlow() {
  const tenantId = 'Vhb5HLKbtfZaHwd9BqMU0fm0le22'; // From proof_test.js
  const visitorId = 'TERMINAL_TEST_UNIT_' + Date.now();
  const message = 'Test message from terminal script at ' + new Date().toISOString();

  console.log('--- STARTING WIDGET FLOW TEST ---');
  console.log('TenantId:', tenantId);
  console.log('VisitorId:', visitorId);

  // 1. Send message via local API (Assuming server is running on 3000)
  // If server is not running, we'll just check the DB logic by manually adding if needed,
  // but let's try the fetch first.
  
  try {
    const res = await fetch('http://localhost:3000/api/widget-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, visitorId, message })
    });
    
    if (res.ok) {
      console.log('✅ API Call Success');
    } else {
      console.log('❌ API Call Failed (Is the server running? Run npm run dev)');
      return;
    }
  } catch (err) {
    console.log('❌ API Call Error:', err.message);
    console.log('Note: Please make sure "npm run dev" is running in another terminal.');
    return;
  }

  // 2. Initialize Admin SDK to check DB
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

  // 3. Check Contact
  const contactPhone = `widget_${visitorId}`;
  const contactQuery = await db.collection('contacts')
    .where('ownerId', '==', tenantId)
    .where('phoneNumber', '==', contactPhone)
    .get();

  if (!contactQuery.empty) {
    const contact = contactQuery.docs[0].data();
    console.log('✅ Contact Found in DB');
    console.log('   Source:', contact.source);
    console.log('   LastMessage:', contact.lastMessage);
    console.log('   UnreadCount:', contact.unreadCount);
    
    if (contact.lastMessage === message) {
       console.log('✅ LastMessage correctly updated');
    } else {
       console.log('❌ LastMessage mismatch or not updated');
    }
  } else {
    console.log('❌ Contact NOT found in DB');
  }

  // 4. Check Message
  const msgQuery = await db.collection('chat_messages')
    .where('ownerId', '==', tenantId)
    .where('contactPhone', '==', contactPhone)
    .get();

  if (!msgQuery.empty) {
    console.log('✅ Message Found in DB');
  } else {
    console.log('❌ Message NOT found in DB');
  }

  console.log('--- TEST COMPLETE ---');
}

testWidgetFlow().catch(console.error);
