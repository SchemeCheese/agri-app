// Firebase client init for the mobile app — mirrors FE/src/lib/firebase.ts but
// reads EXPO_PUBLIC_FIREBASE_* env vars (baked at bundle time by Expo).
//
// WHY THIS EXISTS: the backend authenticates Google sign-in with Firebase
// Admin's verifyIdToken(), which ONLY accepts *Firebase* ID tokens. Expo's
// expo-auth-session hands us a raw *Google* OAuth id_token, which the backend
// rejects with 401. So the app must trade the Google token for a Firebase token
// (GoogleAuthProvider.credential → signInWithCredential → getIdToken) — see
// services/googleAuth.ts. This module just provides the initialized Auth.
//
// We deliberately use getAuth() with default in-memory persistence: the app
// persists its OWN backend JWT (Zustand + AsyncStorage), and the Firebase
// session is only needed momentarily to mint one ID token, so there's nothing
// worth persisting on the Firebase side. This also keeps us fully Expo Go
// compatible (no native modules).
//
// SETUP: copy the same Firebase web config FE uses (Firebase Console → Project
// Settings → Your apps → Web app) into APP/.env as EXPO_PUBLIC_FIREBASE_*.
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// apiKey + authDomain + projectId + appId are the minimum needed for Auth.
const REQUIRED_KEYS: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

/** True when every required Firebase env var is present. */
export const isFirebaseConfigured = (): boolean =>
  REQUIRED_KEYS.every((k) => !!firebaseConfig[k]);

let firebaseAuthInstance: Auth | null = null;

export const getFirebaseAuth = (): Auth => {
  if (firebaseAuthInstance) return firebaseAuthInstance;

  if (!isFirebaseConfigured()) {
    const missing = REQUIRED_KEYS.filter((k) => !firebaseConfig[k])
      .map((k) => `EXPO_PUBLIC_FIREBASE_${String(k).replace(/([A-Z])/g, '_$1').toUpperCase()}`)
      .join(', ');
    throw new Error(`Missing Firebase env vars: ${missing}. Add them to APP/.env and reload Expo.`);
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  firebaseAuthInstance = getAuth(app);
  return firebaseAuthInstance;
};
