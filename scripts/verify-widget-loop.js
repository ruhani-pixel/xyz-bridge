const admin = require('firebase-admin');
const fetch = require('node-fetch');

// FULL FLOW VERIFICATION SCRIPT
// This script tests:
// 1. Inbound: Visitor -> CRM Inbox
// 2. Outbound: CRM Agent -> Visitor Chat

async function verifyLoop() {
  const tenantId = 'Vhb5HLKbtfZaHwd9BqMU0fm0le22'; // Target test tenant
  const visitorId = 'VERIFY_LOOP_' + Date.now();
  const visitorName = 'Terminal Tester';
  const inboundContent = 'Bhai, kya ye loop kaam kar raha hai?';
  const outboundContent = 'Haan bhai, 100% kaam kar raha hai! 🚀';

  console.log('🚀 INITIALIZING FULL LOOP VERIFICATION...');

  // 1. SIMULATE VISITOR SENDING MESSAGE (Inbound)
  console.log('\n--- STEP 1: VISITOR -> CRM ---');
  try {
    const res = await fetch('http://localhost:3000/api/widget-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, visitorId, visitorName, message: inboundContent })
    });
    if (res.ok) {
      console.log('✅ Visitor message sent via API');
    } else {
      console.log('❌ Visitor message failed. Is server running?');
      return;
    }
  } catch (err) {
    console.error('❌ Error sending visitor message:', err.message);
    return;
  }

  // 2. INITIALIZE FIREBASE ADMIN TO VERIFY AND REPLY
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

  // 3. VERIFY CONTACT DOCUMENT
  const contactPhone = `widget_${visitorId}`;
  const contactRef = db.collection('contacts').doc(contactPhone); // Actually, the ID is generated, so let's query
  const contactQuery = await db.collection('contacts').where('phoneNumber', '==', contactPhone).get();
  
  if (!contactQuery.empty) {
    const data = contactQuery.docs[0].data();
    console.log('✅ CRM Contact created correctly');
    console.log('   Last Message in CRM:', data.lastMessage);
    if (data.lastMessage === inboundContent) console.log('   ✅ Content Match!');
  } else {
    console.log('❌ CRM Contact NOT found!');
    return;
  }

  // 4. SIMULATE AGENT REPLYING FROM CRM (Outbound)
  console.log('\n--- STEP 2: CRM -> VISITOR ---');
  // We'll simulate what /api/chat/send would do
  await db.collection('chat_messages').add({
    ownerId: tenantId,
    contactPhone: contactPhone,
    direction: 'outbound',
    sender: 'agent',
    content: outboundContent,
    contentType: 'text',
    source: 'widget',
    status: 'sent',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ Agent reply saved to DB');

  // 5. VERIFY VISITOR FETCHES THE REPLY
  console.log('\n--- STEP 3: VISITOR FETCHING HISTORY ---');
  try {
    const res = await fetch(`http://localhost:3000/api/widget-chat?tenantId=${tenantId}&visitorId=${visitorId}`);
    const data = await res.json();
    const messages = data.messages || [];
    
    console.log(`✅ Visitor history fetched. Found ${messages.length} messages.`);
    const replyMsg = messages.find(m => m.direction === 'outbound' && m.content === outboundContent);
    
    if (replyMsg) {
      console.log('✅ SUCCESS: Visitor received the agent reply!');
      console.log('   Reply Content:', replyMsg.content);
    } else {
      console.log('❌ FAIL: Agent reply NOT found in visitor history!');
    }
  } catch (err) {
    console.error('❌ Error fetching visitor history:', err.message);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyLoop().catch(console.error);
