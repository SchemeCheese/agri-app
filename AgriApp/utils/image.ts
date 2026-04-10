import { Platform } from 'react-native';

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const railwayPublicBaseUrl = 'https://agri-connect-be-production.up.railway.app';

const fallbackBaseUrl = Platform.select({
  android: railwayPublicBaseUrl,
  default: railwayPublicBaseUrl,
});

export const resolveImageUrl = (image?: string) => {
  if (!image) return 'https://via.placeholder.com/400x300?text=Agri';
  if (ABSOLUTE_URL_REGEX.test(image)) return image;

  const base = process.env.EXPO_PUBLIC_API_URL ?? fallbackBaseUrl ?? 'http://localhost:3001';
  return `${base}${image.startsWith('/') ? '' : '/'}${image}`;
};
