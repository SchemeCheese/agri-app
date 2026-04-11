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
