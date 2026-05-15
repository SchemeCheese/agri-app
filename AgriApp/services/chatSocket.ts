import api from '@/api/client';

type SocketLike = {
  connected: boolean;
  disconnect: () => void;
  removeAllListeners?: (event?: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  timeout: (ms: number) => {
    emit: (event: string, payload: Record<string, unknown>, callback: (err: Error | null, response: any) => void) => void;
  };
};

// Metro + Expo can fail resolving socket.io-client package exports on iOS,
// so we use the bundled UMD build directly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const socketIoModule = require('socket.io-client/dist/socket.io.js');
const io = socketIoModule?.io ?? socketIoModule;

type StartNegotiationPayload = {
  productId: string;
  quantity: number;
  proposedPrice: number;
};

type JoinRoomPayload = {
  conversationId: string;
};

type SendMessagePayload = {
  conversationId: string;
  content: string;
  clientMessageId?: string;
};

type SendImageMessagePayload = {
  conversationId: string;
  imageUrl: string;
  caption?: string;
  clientMessageId?: string;
};

type SendNegotiationQuotePayload = {
  conversationId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
};

type RespondToQuotePayload = {
  conversationId: string;
  messageId: string;
  action: 'ACCEPTED' | 'REJECTED';
};

type CancelNegotiationPayload = {
  conversationId: string;
};

type ChatSocketMessage = {
  id: string;
  conversationId?: string;
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
};

type QuoteUpdatedEvent = {
  messageId: string;
  status: string;
};

type NegotiationCancelledEvent = {
  conversationId: string;
};

type NegotiationAcceptedEvent = {
  checkoutData?: {
    productId?: string;
    productName?: string;
    quantity?: number;
    negotiatedPrice?: number;
    unit?: string;
    sellerId?: string;
  };
};

let chatSocket: SocketLike | null = null;
let connectedToken: string | null = null;
// Promise inflight để 2 caller song song không cùng tạo 2 socket cho cùng token
let connectingPromise: Promise<SocketLike> | null = null;

const toSocketBaseUrl = (baseUrl?: string) => {
  const fallback = 'https://agri-connect-be-production.up.railway.app';
  if (!baseUrl) return fallback;

  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return fallback;
  }
};

// Tear down hoàn toàn — gọi khi logout hoặc token đổi.
const teardownSocket = (socket: SocketLike | null) => {
  if (!socket) return;
  try {
    socket.removeAllListeners?.();
  } catch {
    /* noop */
  }
  try {
    socket.disconnect();
  } catch {
    /* noop */
  }
};

export const disconnectChatSocket = () => {
  teardownSocket(chatSocket);
  chatSocket = null;
  connectedToken = null;
  connectingPromise = null;
};

const ensureChatSocket = async (accessToken: string): Promise<SocketLike> => {
  // Token đổi → tear down socket cũ trước khi tạo mới
  if (chatSocket && connectedToken !== accessToken) {
    teardownSocket(chatSocket);
    chatSocket = null;
    connectedToken = null;
    connectingPromise = null;
  }

  // Đã kết nối → trả luôn
  if (chatSocket && chatSocket.connected) return chatSocket;

  // Đang trong quá trình kết nối với cùng token → đợi xong
  if (connectingPromise && connectedToken === accessToken) {
    return connectingPromise;
  }

  const base = toSocketBaseUrl(api.defaults.baseURL);

  // Nếu chưa có socket → tạo mới
  if (!chatSocket) {
    chatSocket = io(`${base}/chat`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${accessToken}` },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    connectedToken = accessToken;

    // BE chủ động disconnect khi auth fail → reset singleton để lần sau tạo lại
    chatSocket.on('disconnect', (reason: string) => {
      // 'io server disconnect' = BE kick → cần manual reconnect
      if (reason === 'io server disconnect') {
        disconnectChatSocket();
      }
    });
  }

  const socket = chatSocket;

  connectingPromise = new Promise<SocketLike>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Khong the ket noi chat server.'));
    }, 10000);

    const onConnect = () => {
      cleanup();
      resolve(socket);
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
  }).finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
};

const emitWithAck = async <T>(socket: SocketLike, eventName: string, payload: Record<string, unknown>) => {
  return new Promise<T>((resolve, reject) => {
    socket.timeout(10000).emit(eventName, payload, (err: Error | null, response: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (response?.message) {
        reject(new Error(response.message));
        return;
      }

      resolve((response?.data ?? response) as T);
    });
  });
};

export const startNegotiation = async (accessToken: string, payload: StartNegotiationPayload) => {
  const socket = await ensureChatSocket(accessToken);
  return emitWithAck(socket, 'startNegotiation', payload);
};

export const joinChatRoom = async (accessToken: string, payload: JoinRoomPayload) => {
  const socket = await ensureChatSocket(accessToken);
  return emitWithAck(socket, 'joinRoom', payload);
};

// Sinh UUID idempotency cho mobile (React Native không có crypto.randomUUID < RN 0.74).
const genClientId = () => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const sendChatMessage = async (accessToken: string, payload: SendMessagePayload) => {
  const socket = await ensureChatSocket(accessToken);
  const finalPayload: SendMessagePayload = {
    ...payload,
    clientMessageId: payload.clientMessageId ?? genClientId(),
  };
  return emitWithAck(socket, 'sendMessage', finalPayload as Record<string, unknown>);
};

export const sendChatImage = async (accessToken: string, payload: SendImageMessagePayload) => {
  const socket = await ensureChatSocket(accessToken);
  const finalPayload: SendImageMessagePayload = {
    ...payload,
    clientMessageId: payload.clientMessageId ?? genClientId(),
  };
  return emitWithAck(socket, 'sendImageMessage', finalPayload as Record<string, unknown>);
};

export const sendNegotiationQuote = async (accessToken: string, payload: SendNegotiationQuotePayload) => {
  const socket = await ensureChatSocket(accessToken);
  return emitWithAck(socket, 'sendNegotiationQuote', payload);
};

export const respondToQuote = async (accessToken: string, payload: RespondToQuotePayload) => {
  const socket = await ensureChatSocket(accessToken);
  return emitWithAck(socket, 'respondToQuote', payload);
};

export const cancelNegotiation = async (accessToken: string, payload: CancelNegotiationPayload) => {
  const socket = await ensureChatSocket(accessToken);
  return emitWithAck(socket, 'cancelNegotiation', payload);
};

export const subscribeNewMessages = async (
  accessToken: string,
  listener: (message: ChatSocketMessage) => void,
) => {
  const socket = await ensureChatSocket(accessToken);
  socket.on('newMessage', listener);

  return () => {
    socket.off('newMessage', listener);
  };
};

export const subscribeQuoteUpdated = async (
  accessToken: string,
  listener: (event: QuoteUpdatedEvent) => void,
) => {
  const socket = await ensureChatSocket(accessToken);
  socket.on('quoteUpdated', listener);

  return () => {
    socket.off('quoteUpdated', listener);
  };
};

export const subscribeNegotiationCancelled = async (
  accessToken: string,
  listener: (event: NegotiationCancelledEvent) => void,
) => {
  const socket = await ensureChatSocket(accessToken);
  socket.on('negotiationCancelled', listener);

  return () => {
    socket.off('negotiationCancelled', listener);
  };
};

export const subscribeNegotiationAccepted = async (
  accessToken: string,
  listener: (event: NegotiationAcceptedEvent) => void,
) => {
  const socket = await ensureChatSocket(accessToken);
  socket.on('negotiationAccepted', listener);

  return () => {
    socket.off('negotiationAccepted', listener);
  };
};

export type UnreadUpdatedEvent = {
  conversationId: string;
  unread: number;
  totalUnread: number;
};

export const subscribeUnreadUpdated = async (
  accessToken: string,
  listener: (event: UnreadUpdatedEvent) => void,
) => {
  const socket = await ensureChatSocket(accessToken);
  socket.on('unreadUpdated', listener);
  return () => {
    socket.off('unreadUpdated', listener);
  };
};
