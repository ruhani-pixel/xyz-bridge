const admin = require('firebase-admin');

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

async function check() {
  console.log('Checking recent contacts and messages...');
  
  const contactsSnap = await db.collection('contacts').orderBy('updatedAt', 'desc').limit(5).get();
  console.log('\n--- RECENT CONTACTS ---');
  contactsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Name: ${data.name}`);
    console.log(`Phone: ${data.phoneNumber}`);
    console.log(`Source: ${data.source}`);
    console.log(`OwnerId: ${data.ownerId}`);
    console.log(`LastMsg: ${data.lastMessage}`);
    console.log(`UpdatedAt: ${data.updatedAt?.toDate?.()?.toISOString()}`);
    console.log('---');
  });

  const messagesSnap = await db.collection('chat_messages').orderBy('timestamp', 'desc').limit(5).get();
  console.log('\n--- RECENT MESSAGES ---');
  messagesSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Content: ${data.content}`);
    console.log(`Source: ${data.source}`);
    console.log(`OwnerId: ${data.ownerId}`);
    console.log(`Phone: ${data.contactPhone}`);
    console.log(`Timestamp: ${data.timestamp?.toDate?.()?.toISOString()}`);
    console.log('---');
  });
}

check().catch(console.error);
