import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, Wallet } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  emailVerifiedOverride: boolean; // For easy evaluation bypass
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  refreshUserStatus: () => Promise<void>;
  bypassVerification: () => void;
  updateLocalWallet: (wallet: Wallet) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerifiedOverride, setEmailVerifiedOverride] = useState(() => {
    return localStorage.getItem('forexarena_email_verified_bypass') === 'true';
  });

  // Admin bypass
  const bypassVerification = () => {
    localStorage.setItem('forexarena_email_verified_bypass', 'true');
    setEmailVerifiedOverride(true);
  };

  const updateLocalWallet = (newWallet: Wallet) => {
    setWallet(newWallet);
  };

  // Helper to fetch user data
  const fetchUserData = async (uid: string, email: string) => {
    try {
      // 1. Fetch user profile
      const userRef = doc(db, 'users', uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        return;
      }

      let profile: UserProfile;

      // Automatically make SantoshGangwar14@gmail.com an admin
      const isAdmin = email.toLowerCase() === 'santoshgangwar14@gmail.com' || email.toLowerCase() === 'admin@forexarena.com';

      if (!userSnap.exists()) {
        profile = {
          uid,
          email,
          createdAt: Date.now(),
          isAdmin,
        };
        try {
          await setDoc(userRef, profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
        }
      } else {
        profile = userSnap.data() as UserProfile;
        // Keep admin status synced if email matches
        if (isAdmin && !profile.isAdmin) {
          profile.isAdmin = true;
          try {
            await setDoc(userRef, { isAdmin: true }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
          }
        }
      }
      setUserProfile(profile);

      // 2. Fetch or create Wallet
      const walletRef = doc(db, 'wallets', uid);
      let walletSnap;
      try {
        walletSnap = await getDoc(walletRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `wallets/${uid}`);
        return;
      }

      let userWallet: Wallet;
      if (!walletSnap.exists()) {
        // Default demo trading account gets $10,000 starting balance
        userWallet = {
          uid,
          balance: 10000,
          equity: 10000,
          margin: 0,
          freeMargin: 10000,
          floatingPL: 0,
          updatedAt: Date.now(),
        };
        try {
          await setDoc(walletRef, userWallet);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `wallets/${uid}`);
        }
      } else {
        userWallet = walletSnap.data() as Wallet;
      }
      setWallet(userWallet);
    } catch (err) {
      console.error('Error fetching user data/wallet from Firestore:', err);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save display name or user profile details
      const userRef = doc(db, 'users', cred.user.uid);
      const isAdmin = email.toLowerCase() === 'santoshgangwar14@gmail.com' || email.toLowerCase() === 'admin@forexarena.com';
      const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        createdAt: Date.now(),
        isAdmin,
      };
      try {
        await setDoc(userRef, profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
      }

      // Create default wallet
      const walletRef = doc(db, 'wallets', cred.user.uid);
      const userWallet: Wallet = {
        uid: cred.user.uid,
        balance: 10000,
        equity: 10000,
        margin: 0,
        freeMargin: 10000,
        floatingPL: 0,
        updatedAt: Date.now(),
      };
      try {
        await setDoc(walletRef, userWallet);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `wallets/${cred.user.uid}`);
      }

      setUserProfile(profile);
      setWallet(userWallet);

      // Send verification email
      await firebaseSendEmailVerification(cred.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Login
  const logIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(cred.user.uid, email);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Send email verification
  const sendEmailVerification = async () => {
    if (auth.currentUser) {
      await firebaseSendEmailVerification(auth.currentUser);
    }
  };

  // Password reset
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Log out
  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
      setWallet(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Log out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh status
  const refreshUserStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
      await fetchUserData(auth.currentUser.uid, auth.currentUser.email || '');
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid, user.email || '');
      } else {
        setUserProfile(null);
        setWallet(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    wallet,
    loading,
    emailVerifiedOverride,
    signUp,
    logIn,
    logOut,
    resetPassword,
    sendEmailVerification,
    refreshUserStatus,
    bypassVerification,
    updateLocalWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
