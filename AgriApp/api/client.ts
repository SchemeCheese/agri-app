import axios from 'axios';
import { Platform } from 'react-native';

const railwayPublicBaseUrl = 'https://agri-connect-be-production.up.railway.app';

const fallbackBaseUrl = Platform.select({
  android: railwayPublicBaseUrl,
  default: railwayPublicBaseUrl,
});

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? fallbackBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;