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
export const uploadChatImage = async (
  accessToken: string,
  asset: { uri: string; mimeType?: string | null; fileName?: string | null },
): Promise<{ url: string; size: number; mime: string }> => {
  const form = new FormData();
  const mime = asset.mimeType || 'image/jpeg';
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : 'jpg';
  const name = asset.fileName || `chat-${Date.now()}.${ext}`;
  // React Native FormData yêu cầu shape { uri, name, type }
  form.append('image', { uri: asset.uri, name, type: mime } as any);

  const { data } = await api.post('/chat/upload-image', form, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
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
