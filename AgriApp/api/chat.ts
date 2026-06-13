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
    messageId?: string;
    productId?: string;
    productName?: string;
    quantity?: number | null;
    price?: number | null;
    unit?: string | null;
    status?: string | null;
    createdAt?: string;
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

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const toNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeChatMessage = (value: unknown): ChatMessage | null => {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, any>;
  const id = toOptionalString(raw.id);
  if (!id) return null;

  const sender = raw.sender && typeof raw.sender === 'object'
    ? {
        id: toOptionalString(raw.sender.id) ?? '',
        full_name: toNullableString(raw.sender.full_name),
      }
    : undefined;
  const contextProduct = raw.context_product && typeof raw.context_product === 'object'
    ? {
        id: toOptionalString(raw.context_product.id) ?? '',
        name: toOptionalString(raw.context_product.name) ?? 'San pham',
        reference_price: toNullableNumber(raw.context_product.reference_price) ?? undefined,
        unit: toOptionalString(raw.context_product.unit),
        min_negotiation_qty: toNullableNumber(raw.context_product.min_negotiation_qty),
        image: toNullableString(raw.context_product.image),
      }
    : null;
  const quote = raw.quote && typeof raw.quote === 'object'
    ? {
        messageId: toOptionalString(raw.quote.messageId) ?? id,
        productId: toOptionalString(raw.quote.productId),
        productName: toOptionalString(raw.quote.productName),
        quantity: toNullableNumber(raw.quote.quantity),
        price: toNullableNumber(raw.quote.price),
        unit: toNullableString(raw.quote.unit),
        status: toNullableString(raw.quote.status),
        createdAt: toOptionalString(raw.quote.createdAt) ?? toOptionalString(raw.created_at),
      }
    : raw.message_type === 'NEGOTIATION_QUOTE' && raw.quote_product_id
      ? {
          messageId: id,
          productId: toOptionalString(raw.quote_product_id),
          productName: toOptionalString(raw.quote_product_name),
          quantity: toNullableNumber(raw.quote_quantity),
          price: toNullableNumber(raw.quote_price),
          unit: toNullableString(raw.quote_unit),
          status: toNullableString(raw.quote_status) ?? 'PENDING',
          createdAt: toOptionalString(raw.created_at),
        }
      : null;
  const orderInfo = raw.orderInfo && typeof raw.orderInfo === 'object'
    ? {
        id: toOptionalString(raw.orderInfo.id),
        status: toNullableString(raw.orderInfo.status),
        payment_status: toNullableString(raw.orderInfo.payment_status),
        payment_method: toNullableString(raw.orderInfo.payment_method),
        orderId: toOptionalString(raw.orderInfo.orderId),
        orderStatus: toNullableString(raw.orderInfo.orderStatus),
        paymentStatus: toNullableString(raw.orderInfo.paymentStatus),
        paymentMethod: toNullableString(raw.orderInfo.paymentMethod),
        checkoutSessionId: toOptionalString(raw.orderInfo.checkoutSessionId),
        totalAmount: toNullableNumber(raw.orderInfo.totalAmount) ?? undefined,
      }
    : null;

  return {
    id,
    sender: sender?.id ? sender : undefined,
    message_content: toOptionalString(raw.message_content),
    message_type: toOptionalString(raw.message_type),
    image_url: toNullableString(raw.image_url),
    created_at: toOptionalString(raw.created_at),
    context_product: contextProduct?.id ? contextProduct : null,
    proposed_quantity: toNullableNumber(raw.proposed_quantity),
    proposed_price: toNullableNumber(raw.proposed_price),
    quote,
    orderInfo,
    conversationId: toOptionalString(raw.conversationId ?? raw.conversation_id),
  };
};

const normalizeConversation = (value: unknown): ConversationSummary | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, any>;
  const id = toOptionalString(raw.id);
  if (!id) return null;

  const partner = raw.partner && typeof raw.partner === 'object' ? raw.partner : {};
  const lastMessage = raw.lastMessage && typeof raw.lastMessage === 'object'
    ? {
        id: toOptionalString(raw.lastMessage.id) ?? '',
        content: toOptionalString(raw.lastMessage.content),
        message_type: toOptionalString(raw.lastMessage.message_type),
        created_at: toOptionalString(raw.lastMessage.created_at),
      }
    : null;

  return {
    id,
    partner: {
      id: toOptionalString(partner.id) ?? '',
      full_name: toOptionalString(partner.full_name),
      avatar: toNullableString(partner.avatar),
    },
    lastMessage: lastMessage?.id ? lastMessage : null,
    unread_count: toNullableNumber(raw.unread_count) ?? 0,
    created_at: toOptionalString(raw.created_at),
  };
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

  return Array.isArray(data)
    ? data.map(normalizeConversation).filter((item): item is ConversationSummary => item !== null)
    : [];
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
    return {
      items: data.map(normalizeChatMessage).filter((item: ChatMessage | null): item is ChatMessage => item !== null),
      nextCursor: null,
      hasMore: false,
    };
  }
  return {
    items: Array.isArray(data?.items)
      ? data.items.map(normalizeChatMessage).filter((item: ChatMessage | null): item is ChatMessage => item !== null)
      : [],
    nextCursor: toNullableString(data?.nextCursor),
    hasMore: !!data?.hasMore,
  };
};
