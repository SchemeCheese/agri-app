import api from '@/api/client';
import { uploadChatImage } from '@/api/chat';

export type DisputeStatus = 'PENDING_SELLER_RESPONSE' | 'UNDER_ADMIN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface MyDispute {
  id: string;
  status: DisputeStatus;
  order: { id: string; status: string; final_total_price: string };
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const disputeApi = {
  // Upload 1 ảnh bằng chứng → URL. Tái dùng uploadChatImage (/chat/upload-image).
  uploadEvidence: (
    token: string,
    asset: { uri: string; mimeType?: string | null; fileName?: string | null },
  ): Promise<string> => uploadChatImage(token, asset).then((r) => r.url),

  create: (token: string, orderId: string, body: { reason: string; images?: string[] }) =>
    api.post(`/disputes/order/${orderId}`, body, auth(token)).then((r) => r.data),

  respond: (token: string, disputeId: string, body: { explanation: string; images?: string[] }) =>
    api.patch(`/disputes/${disputeId}/respond`, body, auth(token)).then((r) => r.data),

  byOrder: async (token: string, orderId: string): Promise<MyDispute | undefined> => {
    const list = await api.get<MyDispute[]>('/disputes/mine', auth(token)).then((r) => r.data);
    return list.find((d) => d.order.id === orderId);
  },
};
