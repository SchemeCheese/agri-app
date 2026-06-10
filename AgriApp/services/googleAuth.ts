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

import { ResponseType } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Alert, Platform } from 'react-native';

import api from '@/api/client';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

export type SyncedSession = {
  message?: string;
  // Phiên đầy đủ:
  access_token?: string;
  user?: any;
  // Hoặc yêu cầu chọn workspace (tài khoản sở hữu cả BUYER + SELLER):
  requiresRoleSelection?: boolean;
  tempToken?: string;
  allowedRoles?: ('BUYER' | 'SELLER' | 'ADMIN')[];
};

/** Friendly, user-facing message shown when Google sign-in isn't configured. */
export const GOOGLE_NOT_CONFIGURED_TITLE = 'Chưa cấu hình đăng nhập Google';
export const GOOGLE_NOT_CONFIGURED_MESSAGE =
  'Chưa cấu hình đăng nhập Google. Vui lòng kiểm tra EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID và các biến EXPO_PUBLIC_FIREBASE_* trong file APP/.env rồi reload Expo.';

/**
 * Message shown when Google sign-in is blocked because the app runs inside
 * Expo Go on iOS. Expo removed the auth proxy (auth.expo.io) in SDK 48+, and
 * Expo Go cannot register the custom/reversed-client-id URL scheme an iOS OAuth
 * client needs — so Google always rejects the redirect with "400 invalid_request".
 * We surface this instead of opening a flow that is guaranteed to fail.
 */
export const GOOGLE_NOT_AVAILABLE_TITLE = 'Google Sign-In không khả dụng';
export const GOOGLE_EXPO_GO_IOS_MESSAGE =
  'Đăng nhập Google trên iPhone Expo Go bị giới hạn bởi OAuth. Vui lòng dùng Email/OTP để đăng nhập demo.';

/**
 * Single source of truth for the "is Google ready?" guard, shared by both the
 * login and register screens so they behave identically.
 *
 * - Returns true → caller may proceed to promptAsync().
 * - Returns false → shows a friendly Vietnamese alert to the user AND logs a
 *   developer-only console warning. Never throws, so the screen can't crash
 *   just because the env var is missing.
 */
export const ensureGoogleConfigured = (isConfigured: boolean, isUnsupportedEnv = false): boolean => {
  // iOS Expo Go: opening Google OAuth here always 400s — show the friendly
  // Email/OTP nudge instead of launching a doomed flow.
  if (isUnsupportedEnv) {
    Alert.alert(GOOGLE_NOT_AVAILABLE_TITLE, GOOGLE_EXPO_GO_IOS_MESSAGE);
    return false;
  }

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

  // --- Two runtimes, two redirect strategies -------------------------------------
  // Expo Go CANNOT register a custom URL scheme: makeRedirectUri() there always
  // returns exp://<LAN-IP>:8081. Google rejects that for BOTH client types
  // (native clients want the reversed-client-id scheme; Web clients want
  // http/https), so a bare exp:// redirect = "400: invalid_request" and is
  // un-whitelistable. The ONLY Google-acceptable redirect that can route back
  // into Expo Go is the (deprecated, fragile) Expo auth proxy
  // https://auth.expo.io/@owner/slug, paired with the WEB client.
  //
  // A dev/standalone build DOES own a custom scheme, so there the native
  // iOS/Android OAuth clients work normally and the provider builds
  // `${applicationId}:/oauthredirect` itself.
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // ── Môi trường KHÔNG hỗ trợ Google OAuth ───────────────────────────────────
  // iOS + Expo Go: proxy auth.expo.io đã bị gỡ (SDK 48+) và Expo Go không đăng ký
  // được custom scheme cho iOS OAuth client ⇒ Google luôn trả 400 invalid_request.
  // Chặn ở đây để không mở flow chắc chắn fail; người dùng demo dùng Email/OTP.
  // (Web / Android / dev build KHÔNG bị chặn — Google vẫn chạy như cũ.)
  const isUnsupportedEnv = isExpoGo && Platform.OS === 'ios';

  const owner = (Constants.expoConfig as { owner?: string } | null)?.owner ?? 'schemecheese';
  const slug = Constants.expoConfig?.slug ?? 'AgriApp';
  const proxyRedirectUri = `https://auth.expo.io/@${owner}/${slug}`;

  // Build the request config per-runtime. Hooks can't be conditional, so we
  // compute one config object and call useAuthRequest exactly once.
  const requestConfig: Parameters<typeof Google.useAuthRequest>[0] = isExpoGo
    ? {
        // FORCE the Web client — passing iosClientId here makes the provider
        // pick the native iOS client, which is what throws the 400 in Expo Go.
        clientId: webClientId ?? 'unconfigured.apps.googleusercontent.com',
        // Implicit flow → id_token comes back directly (no client secret needed).
        responseType: ResponseType.IdToken,
        scopes: ['profile', 'email'],
        redirectUri: proxyRedirectUri,
      }
    : {
        // Dev/standalone build: native per-platform clients, provider-built
        // `${applicationId}:/oauthredirect`. Code flow auto-exchanges to an
        // id_token (surfaced on response.params.id_token).
        webClientId,
        iosClientId,
        androidClientId,
        scopes: ['profile', 'email'],
      };
  // Crash-guard: the hook validates a clientId synchronously at init.
  if (!isExpoGo && !webClientId && !iosClientId && !androidClientId) {
    (requestConfig as { clientId?: string }).clientId = 'unconfigured.apps.googleusercontent.com';
  }

  // In Expo Go, copy THIS exact string into Google Cloud Console → Web client →
  // Authorized redirect URIs. Logged so the value is never a guess.
  if (isExpoGo) {
    console.log('[googleAuth] Expo Go redirectUri (add to Google Web client) =', proxyRedirectUri);
  }

  const [request, response, promptAsync] = Google.useAuthRequest(requestConfig);

  // The client ID that actually gates sign-in on THIS runtime/platform.
  const effectiveClientId = isExpoGo
    ? webClientId
    : Platform.select({ ios: iosClientId, android: androidClientId, default: webClientId });

  return {
    request,
    response,
    promptAsync,
    // true khi đang chạy iOS Expo Go — caller nên hiện thông báo Email/OTP thay vì
    // mở Google OAuth (sẽ 400). Xem GOOGLE_EXPO_GO_IOS_MESSAGE.
    isUnsupportedEnv,
    // Google sign-in needs the relevant OAuth client ID (for expo-auth-session)
    // AND the Firebase web config (to exchange the token below).
    isConfigured: !!effectiveClientId && isFirebaseConfigured(),
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
