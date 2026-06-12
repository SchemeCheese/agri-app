import { API_BASE_URL } from '@/api/client';

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

/**
 * Chuẩn hoá URL ảnh hiển thị.
 * - Ảnh dán link tuyệt đối (http/https) → giữ nguyên.
 * - Ảnh upload từ máy → BE lưu đường dẫn TƯƠNG ĐỐI `/uploads/...`; phải ghép với
 *   ĐÚNG base mà API client đang dùng (API_BASE_URL) — nếu không, file lưu ở
 *   backend này lại bị request sang backend khác → 404 (ảnh không hiện), trong khi
 *   link tuyệt đối vẫn hiện. Đây là lý do "upload từ máy không hiện như dán link".
 */
export const resolveImageUrl = (image?: string) => {
  if (!image) return 'https://via.placeholder.com/400x300?text=Agri';
  if (ABSOLUTE_URL_REGEX.test(image)) return image;

  const base = API_BASE_URL || 'http://localhost:3001';
  return `${base}${image.startsWith('/') ? '' : '/'}${image}`;
};
