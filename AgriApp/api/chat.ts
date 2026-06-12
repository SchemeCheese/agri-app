import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import api from './client';

export type InitiateChatPayload = {
  partnerId: string;
  productId?: string;
};

export type ConversationSummary = {
  id: string;
  partner: {
    id: string;
    full_name?: string;
    avatar?: string | null;
  };
  lastMessage?: {
    id: string;
    content?: string;
    message_type?: string;
    created_at?: string;
  } | null;
  unread_count?: number;
  created_at?: string;
};

export type ChatMessage = {
  id: string;
  sender?: {
    id: string;
    full_name?: string | null;
  };
  message_content?: string;
  message_type?: string;
  image_url?: string | null;
  created_at?: string;
  context_product?: {
    id: string;
    name: string;
    reference_price?: number;
    unit?: string;
    min_negotiation_qty?: number | null;
    image?: string | null;
  } | null;
  proposed_quantity?: number | null;
  proposed_price?: number | null;
  quote?: {
    productId?: string;
    productName?: string;
    quantity?: number | null;
    price?: number | null;
    unit?: string | null;
    status?: string | null;
  } | null;
  orderInfo?: {
    id?: string;
    status?: string | null;
    payment_status?: string | null;
    payment_method?: string | null;
    orderId?: string;
    orderStatus?: string | null;
    paymentStatus?: string | null;
    paymentMethod?: string | null;
    checkoutSessionId?: string;
    totalAmount?: number;
  } | null;
  conversationId?: string;
};

export type InitiateChatResponse = {
  conversationId: string;
  partner?: {
    id: string;
    full_name?: string;
  };
  product?: {
    id: string;
    name: string;
    reference_price: number;
    unit: string;
    min_negotiation_qty?: number | null;
    image?: string | null;
  } | null;
};

// ─── Upload ảnh chat ─────────────────────────────────────────────────────
// uri: file:// hoặc content:// từ expo-image-picker.
// Trả về { url } để FE dùng cho event WS sendImageMessage.
//
// On native (iOS/Android, incl. Expo Go) we upload via expo-file-system's
// FileSystem.uploadAsync instead of an axios FormData POST. uploadAsync streams
// the file through the platform's NATIVE networking stack, which:
//   • reads the iOS `file:///` (and Android `content://`) URI directly — no
//     JS-side blob marshalling that physical iPhones choke on;
//   • builds the `multipart/form-data; boundary=...` itself, so there's no risk
//     of axios/RN stripping the boundary (the old "operation has timed out").
// Web keeps the axios path because uploadAsync is native-only.
export const uploadChatImage = async (
  accessToken: string,
  asset: { uri: string; mimeType?: string | null; fileName?: string | null },
): Promise<{ url: string; size: number; mime: string }> => {
  const mime = asset.mimeType || 'image/jpeg';
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : 'jpg';
  const name = asset.fileName || `chat-${Date.now()}.${ext}`;

  // Web has no native FileSystem.uploadAsync → keep the axios FormData path.
  if (Platform.OS === 'web') {
    const form = new FormData();
    // React Native FormData yêu cầu shape { uri, name, type }
    form.append('image', { uri: asset.uri, name, type: mime } as any);
    // Do NOT set Content-Type — the client interceptor clears it for FormData so
    // RN can fill in the boundary itself.
    const { data } = await api.post('/chat/upload-image', form, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 60000,
    });
    return data as { url: string; size: number; mime: string };
  }

  // Native: uploadAsync needs an ABSOLUTE url (no axios baseURL merging).
  const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
  const endpoint = `${base}/chat/upload-image`;

  const result = await FileSystem.uploadAsync(endpoint, asset.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'image', // must match the multer field on /chat/upload-image
    mimeType: mime,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload ảnh thất bại (HTTP ${result.status}): ${result.body?.slice(0, 200)}`);
  }
  return JSON.parse(result.body) as { url: string; size: number; mime: string };
};

export const initiateChat = async (accessToken: string, payload: InitiateChatPayload) => {
  const { data } = await api.post<InitiateChatResponse>('/chat/initiate', payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export const getConversations = async (accessToken: string) => {
  const { data } = await api.get<ConversationSummary[]>('/chat/conversations', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return Array.isArray(data) ? data : [];
};

export interface GetMessagesResult {
  items: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const getConversationMessages = async (
  accessToken: string,
  conversationId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<GetMessagesResult> => {
  const params: Record<string, string> = {};
  if (opts.limit) params.limit = String(opts.limit);
  if (opts.before) params.before = opts.before;

  const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });

  // BE shape mới: { items, nextCursor, hasMore }. Fallback cho mảng cũ.
  if (Array.isArray(data)) {
    return { items: data, nextCursor: null, hasMore: false };
  }
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasMore: !!data?.hasMore,
  };
};
