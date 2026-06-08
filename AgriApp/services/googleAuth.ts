// Google OAuth helper using expo-auth-session/providers/google.
// Mirrors FE web's Firebase Google flow: get an idToken, POST /auth/sync,
// receive { access_token, user } from BE — same DB row, same JWT shape.
//
// SETUP (one-time):
//   1. Open Firebase Console → Project agriconnect-40a6a → Authentication → Sign-in method
//      → enable Google provider if not already.
//   2. Go to Google Cloud Console → APIs & Services → Credentials.
//      Find "Web client (auto created by Google Service)" — copy its Client ID
//      (looks like 395364579986-xxxxxxxxxxxxxxxxxx.apps.googleusercontent.com).
//   3. Paste that ID into APP/.env as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
//   4. (Optional, native Android dev build) — also add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
//      and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID. In plain Expo Go these are NOT required;
//      the web client ID alone is enough for the auth proxy redirect.
//   5. Reload Expo so the env var is picked up.

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Alert } from 'react-native';

import api from '@/api/client';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

export type SyncedSession = {
  message?: string;
  access_token: string;
  user: any;
};

/** Friendly, user-facing message shown when Google sign-in isn't configured. */
export const GOOGLE_NOT_CONFIGURED_TITLE = 'Chưa cấu hình đăng nhập Google';
export const GOOGLE_NOT_CONFIGURED_MESSAGE =
  'Chưa cấu hình đăng nhập Google. Vui lòng kiểm tra EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID và các biến EXPO_PUBLIC_FIREBASE_* trong file APP/.env rồi reload Expo.';

/**
 * Single source of truth for the "is Google ready?" guard, shared by both the
 * login and register screens so they behave identically.
 *
 * - Returns true → caller may proceed to promptAsync().
 * - Returns false → shows a friendly Vietnamese alert to the user AND logs a
 *   developer-only console warning. Never throws, so the screen can't crash
 *   just because the env var is missing.
 */
export const ensureGoogleConfigured = (isConfigured: boolean): boolean => {
  if (isConfigured) return true;

  // Developer-facing hint only — normal users never see this.
  console.warn(
    '[googleAuth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is empty — Google sign-in is disabled. ' +
      'Add it to APP/.env and reload Expo (env vars are baked at bundle time).',
  );

  Alert.alert(GOOGLE_NOT_CONFIGURED_TITLE, GOOGLE_NOT_CONFIGURED_MESSAGE);
  return false;
};

export const useGoogleAuth = (role?: 'BUYER' | 'SELLER') => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  // expo-auth-session validates the clientId synchronously at hook init; passing
  // a bogus-but-shaped placeholder when the env var isn't filled keeps the screen
  // from crashing on render. We block actual sign-in via `isConfigured` below.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId || 'unconfigured.apps.googleusercontent.com',
    androidClientId,
    iosClientId,
    scopes: ['profile', 'email'],
  });

  return {
    request,
    response,
    promptAsync,
    // Google sign-in needs BOTH the OAuth web client ID (for expo-auth-session)
    // AND the Firebase web config (to exchange the Google token below).
    isConfigured: !!webClientId && isFirebaseConfigured(),
    // Takes the raw Google OAuth id_token from expo-auth-session and returns the
    // backend session.
    //
    // The exchange step is mandatory: the BE verifies tokens with Firebase
    // Admin's verifyIdToken(), which only accepts *Firebase* ID tokens. Sending
    // the Google token straight to /auth/sync returns 401. So we mirror FE web —
    // build a Google credential, sign in to Firebase, then forward the resulting
    // *Firebase* ID token. /auth/sync upserts the User row keyed by firebase_uid.
    syncWithBackend: async (googleIdToken: string): Promise<SyncedSession> => {
      const auth = getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCred = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCred.user.getIdToken(true);

      const body: Record<string, unknown> = { idToken: firebaseIdToken };
      if (role) body.role = role;
      try {
        const { data } = await api.post('/auth/sync', body);
        return data as SyncedSession;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const { data } = await api.post('/auth/firebase', body);
          return data as SyncedSession;
        }
        throw err;
      }
    },
  };
};
