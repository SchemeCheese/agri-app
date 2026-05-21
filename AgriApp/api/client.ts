import axios from 'axios';
import { Platform } from 'react-native';

const railwayPublicBaseUrl = 'https://agri-connect-be-production.up.railway.app';

// Android emulator routes localhost to itself; the host machine is 10.0.2.2
// iOS simulator and web both resolve localhost correctly
const localBaseUrl = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? localBaseUrl : railwayPublicBaseUrl);

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mirrors FE/lib/axios.ts — request interceptor pulls the JWT from the persisted
// Zustand auth store so callers don't have to thread accessToken through every
// useEffect. Existing explicit `headers: { Authorization: ... }` keep working
// because axios merges per-request headers on top of these defaults.
api.interceptors.request.use(
  (config) => {
    try {
      // Lazy require to avoid the Metro circular dep that would happen if
      // store/authStore.ts imported anything that imports this client.
      const { useAuthStore } = require('@/store/authStore');
      const token = useAuthStore.getState().accessToken;
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* store not initialized yet — fall through unauthenticated */
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.warn(`[API] Network error — could not reach ${baseURL}`, error.message);
    } else if (error.response.status >= 500) {
      console.warn(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response.status}`);
    }
    return Promise.reject(error);
  },
);

export default api;