export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL;

export const resolveImageUrl = (url?: string | null) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${normalized}`;
};
