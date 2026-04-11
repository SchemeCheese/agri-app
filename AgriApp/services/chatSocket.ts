import api from '@/api/client';

type SocketLike = {
  connected: boolean;
  disconnect: () => void;
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

const ensureChatSocket = async (accessToken: string) => {
  const base = toSocketBaseUrl(api.defaults.baseURL);

  if (!chatSocket || connectedToken !== accessToken) {
    if (chatSocket) {
      chatSocket.disconnect();
    }

    chatSocket = io(`${base}/chat`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${accessToken}` },
      reconnection: true,
      timeout: 10000,
    });

    connectedToken = accessToken;
  }

  if (chatSocket.connected) return chatSocket;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Khong the ket noi chat server.'));
    }, 10000);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      chatSocket?.off('connect', onConnect);
      chatSocket?.off('connect_error', onError);
    };

    chatSocket?.on('connect', onConnect);
    chatSocket?.on('connect_error', onError);
  });

  return chatSocket;
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

export const sendChatMessage = async (accessToken: string, payload: SendMessagePayload) => {
  const socket = await ensureChatSocket(accessToken);
  return emitWithAck(socket, 'sendMessage', payload);
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
