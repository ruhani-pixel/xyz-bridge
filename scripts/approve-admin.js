const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

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
const emailToApprove = 'inquiry.ruhani@gmail.com';

async function approveUser() {
  console.log(`Searching for user: ${emailToApprove}...`);
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', emailToApprove).get();

  if (snapshot.empty) {
    console.log('No user found with that email. Make sure you have signed in once.');
    return;
  }

  const userDoc = snapshot.docs[0];
  console.log(`Found user! UID: ${userDoc.id}. Updating to Superadmin...`);

  await userDoc.ref.update({
    isApproved: true,
    role: 'superadmin'
  });

  console.log('SUCCESS: User inquiry.ruhani@gmail.com is now an approved Superadmin.');
}

approveUser().catch(console.error);
