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

export default api;