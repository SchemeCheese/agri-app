import api from './client';

export type InitiateChatPayload = {
  partnerId: string;
  productId?: string;
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
