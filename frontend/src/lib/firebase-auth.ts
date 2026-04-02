'use client';

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type AuthError,
} from 'firebase/auth';
import type { User, UserRole } from '@/store/mentorship-store';
import { getFirebaseAuth } from './firebase';

interface FirebaseSessionResponse {
  user: User;
}

interface SignupOptions {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

async function exchangeFirebaseTokenForSession(input: {
  idToken: string;
  name?: string;
  role?: UserRole;
}) {
  const response = await fetch('/api/auth/firebase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => null)) as FirebaseSessionResponse | { error?: string } | null;

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to create backend session');
  }

  return data.user;
}

async function ensureFirebasePersistence() {
  await setPersistence(getFirebaseAuth(), browserLocalPersistence);
}

export async function loginWithFirebase(email: string, password: string) {
  await ensureFirebasePersistence();

  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const idToken = await credential.user.getIdToken();

  return exchangeFirebaseTokenForSession({ idToken });
}

export async function signupWithFirebase({
  email,
  password,
  name,
  role,
}: SignupOptions) {
  await ensureFirebasePersistence();

  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );

  try {
    await updateProfile(credential.user, {
      displayName: name,
    });

    const idToken = await credential.user.getIdToken();

    return await exchangeFirebaseTokenForSession({
      idToken,
      name,
      role,
    });
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function restoreBackendSessionFromFirebase() {
  const auth = getFirebaseAuth();
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    return null;
  }

  try {
    const idToken = await firebaseUser.getIdToken();
    return await exchangeFirebaseTokenForSession({ idToken });
  } catch (error) {
    console.error('Failed to restore backend session from Firebase:', error);
    return null;
  }
}

export async function logoutEverywhere() {
  const auth = getFirebaseAuth();
  const operations: Promise<unknown>[] = [
    fetch('/api/auth/logout', {
      method: 'POST',
    }).catch(() => undefined),
  ];

  if (auth.currentUser) {
    operations.push(signOut(auth));
  }

  await Promise.allSettled(operations);
}

export function getFirebaseAuthErrorMessage(error: unknown) {
  const authError = error as AuthError | undefined;

  switch (authError?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      if (error instanceof Error) {
        return error.message;
      }

      return 'Authentication failed.';
  }
}
