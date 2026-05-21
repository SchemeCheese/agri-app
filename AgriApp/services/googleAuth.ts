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

import api from '@/api/client';

WebBrowser.maybeCompleteAuthSession();

export type SyncedSession = {
  message?: string;
  access_token: string;
  user: any;
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
    isConfigured: !!webClientId,
    syncWithBackend: async (idToken: string): Promise<SyncedSession> => {
      // Same endpoint web uses. /auth/sync upserts the User row keyed by firebase_uid.
      const body: Record<string, unknown> = { idToken };
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
