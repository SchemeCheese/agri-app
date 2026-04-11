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

export const getConversationMessages = async (accessToken: string, conversationId: string) => {
  const { data } = await api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return Array.isArray(data) ? data : [];
};
