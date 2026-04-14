import { adminAuth, adminDb } from './admin';

export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

export async function getUserRole(uid: string) {
  try {
    const doc = await adminDb.collection('users').doc(uid).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    return null;
  }
}
