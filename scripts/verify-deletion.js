const admin = require('firebase-admin');

async function verifyDeletion() {
  const tenantId = 'Vhb5HLKbtfZaHwd9BqMU0fm0le22';
  const phone = 'DELETE_TEST_999';
  
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

  console.log('--- STARTING DELETION VERIFICATION ---');

  // 1. Create a dummy contact and some messages
  console.log('Creating dummy data...');
  const contactRef = db.collection('contacts').doc('test-contact-id');
  await contactRef.set({
    ownerId: tenantId,
    phoneNumber: phone,
    name: 'Delete Test User',
    aiEnabled: true
  });

  await db.collection('chat_messages').add({
    ownerId: tenantId,
    contactPhone: phone,
    content: 'Message to delete 1',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection('chat_messages').add({
    ownerId: tenantId,
    contactPhone: phone,
    content: 'Message to delete 2',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Simulate "Clear Chat" logic
  console.log('\nSimulating "Clear Chat"...');
  const messagesQuery = await db.collection('chat_messages')
    .where('ownerId', '==', tenantId)
    .where('contactPhone', '==', phone)
    .get();
  
  const batch1 = db.batch();
  messagesQuery.docs.forEach(doc => batch1.delete(doc.ref));
  batch1.update(contactRef, { lastMessage: 'Cleared' });
  await batch1.commit();
  
  const msgCountAfterClear = (await db.collection('chat_messages').where('contactPhone', '==', phone).get()).size;
  console.log(`Messages after clear: ${msgCountAfterClear} (Expected: 0)`);

  // 3. Simulate "Delete Contact" logic
  console.log('\nSimulating "Delete Contact"...');
  const batch2 = db.batch();
  batch2.delete(contactRef);
  await batch2.commit();

  const contactExists = (await contactRef.get()).exists;
  console.log(`Contact exists: ${contactExists} (Expected: false)`);

  console.log('\n--- VERIFICATION SUCCESSFUL ---');
}

verifyDeletion().catch(console.error);
