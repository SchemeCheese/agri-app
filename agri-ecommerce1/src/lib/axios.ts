// src/lib/axios.ts
import axios from 'axios';
import { API_BASE_URL } from './runtime-config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor: Tự động đính kèm Token (nếu có) trước khi gửi request
api.interceptors.request.use(
  (config) => {
    // Chỉ chạy trên trình duyệt (client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;