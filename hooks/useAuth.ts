'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { AdminUser, UserRole } from '../types/user';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setAdminData(null);
        setLoading(false);
        return;
      }

      // Listen to Firestore doc for this user
      const docRef = doc(db, 'users', authUser.uid);
      const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setAdminData(docSnap.data() as AdminUser);
        } else {
          setAdminData(null);
        }
        setLoading(false);
      });

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  return { 
    user, 
    role: adminData?.role || 'user' as UserRole, 
    isApproved: adminData?.isApproved || false, 
    accountType: adminData?.accountType || null,
    onboardingComplete: adminData?.onboardingComplete || false,
    adminData,
    loading 
  };
}
