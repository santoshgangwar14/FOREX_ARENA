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

export function getFirebaseUserMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in or use another email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Your password is too weak. Please choose a stronger password.',
    'auth/user-not-found': 'No account was found with this email address.',
    'auth/wrong-password': 'The email or password is incorrect. Please try again.',
    'auth/invalid-credential': 'The email or password is incorrect. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'We could not connect to the service. Please check your internet connection and try again.',
    'auth/user-disabled': 'This account is currently unavailable. Please contact support.',
    'auth/requires-recent-login': 'Please sign in again and retry this action.',
    'auth/operation-not-allowed': 'This action is currently unavailable. Please try again later.',
    'auth/missing-password': 'Please enter your password.',
    'auth/invalid-verification-code': 'The verification code is invalid or expired. Please request a new one.',
    'auth/invalid-action-code': 'This link is invalid or has expired. Please request a new one.',
  };

  return messages[code] || fallback;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  emailVerifiedOverride: boolean;
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerifiedOverride, setEmailVerifiedOverride] = useState(() =>
    localStorage.getItem('forexarena_email_verified_bypass') === 'true'
  );

  const bypassVerification = () => {
    localStorage.setItem('forexarena_email_verified_bypass', 'true');
    setEmailVerifiedOverride(true);
  };

  const updateLocalWallet = (newWallet: Wallet) => setWallet(newWallet);

  const fetchUserData = async (uid: string, email: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        return;
      }

      let profile: UserProfile;
      const isAdmin = email.toLowerCase() === 'santoshgangwar14@gmail.com' || email.toLowerCase() === 'admin@forexarena.com';

      if (!userSnap.exists()) {
        profile = { uid, email, createdAt: Date.now(), isAdmin };
        try {
          await setDoc(userRef, profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
        }
      } else {
        profile = userSnap.data() as UserProfile;
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
      console.error('Error loading account data:', err);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', cred.user.uid);
      const isAdmin = email.toLowerCase() === 'santoshgangwar14@gmail.com' || email.toLowerCase() === 'admin@forexarena.com';
      const profile: UserProfile = { uid: cred.user.uid, email, displayName, createdAt: Date.now(), isAdmin };

      try {
        await setDoc(userRef, profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
      }

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
      await firebaseSendEmailVerification(cred.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

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

  const sendEmailVerification = async () => {
    if (auth.currentUser) await firebaseSendEmailVerification(auth.currentUser);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUserProfile(null);
      setWallet(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
      await fetchUserData(auth.currentUser.uid, auth.currentUser.email || '');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await fetchUserData(user.uid, user.email || '');
      else {
        setUserProfile(null);
        setWallet(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}
