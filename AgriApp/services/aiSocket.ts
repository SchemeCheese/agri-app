// AI Assistant socket service — namespace /ai-chat.
// Tách biệt khỏi chatSocket.ts để dễ tear down độc lập.
import api from '@/api/client';

type AIMode = 'BUYER' | 'SELLER';

type AISocketLike = {
  connected: boolean;
  disconnect: () => void;
  removeAllListeners?: (event?: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  emit: (event: string, payload: Record<string, unknown>) => void;
};

// Metro can fail resolving socket.io-client package exports → dùng UMD bundle
// eslint-disable-next-line @typescript-eslint/no-var-requires
const socketIoModule = require('socket.io-client/dist/socket.io.js');
const io = socketIoModule?.io ?? socketIoModule;

let aiSocket: AISocketLike | null = null;
let connectedToken: string | null = null;
let connectingPromise: Promise<AISocketLike> | null = null;

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

const teardown = (socket: AISocketLike | null) => {
  if (!socket) return;
  try { socket.removeAllListeners?.(); } catch { /* noop */ }
  try { socket.disconnect(); } catch { /* noop */ }
};

export const disconnectAISocket = () => {
  teardown(aiSocket);
  aiSocket = null;
  connectedToken = null;
  connectingPromise = null;
};

export const ensureAISocket = async (accessToken: string): Promise<AISocketLike> => {
  if (aiSocket && connectedToken !== accessToken) {
    teardown(aiSocket);
    aiSocket = null;
    connectedToken = null;
    connectingPromise = null;
  }
  if (aiSocket && aiSocket.connected) return aiSocket;

  if (connectingPromise && connectedToken === accessToken) {
    return connectingPromise;
  }

  const base = toSocketBaseUrl(api.defaults.baseURL);

  if (!aiSocket) {
    aiSocket = io(`${base}/ai-chat`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${accessToken}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    connectedToken = accessToken;
    aiSocket!.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect') disconnectAISocket();
    });
  }

  const socket = aiSocket!;
  connectingPromise = new Promise<AISocketLike>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Khong ket noi duoc tro ly AI.'));
    }, 10000);
    const onConnect = () => { cleanup(); resolve(socket); };
    const onError = (err: Error) => { cleanup(); reject(err); };
    const cleanup = () => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
    };
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
  }).finally(() => { connectingPromise = null; });

  return connectingPromise;
};

// ── High-level API ─────────────────────────────────────────────────────────
export interface AskPayload {
  content: string;
  sessionId?: string;
  mode: AIMode;
  context?: { productId?: string; shopId?: string };
}

export const askAI = async (accessToken: string, payload: AskPayload) => {
  const socket = await ensureAISocket(accessToken);
  socket.emit('ai:ask', payload as Record<string, unknown>);
};

export const subscribeAIEvents = async (
  accessToken: string,
  handlers: {
    onThinking?: (payload: { sessionId: string | null }) => void;
    onToolStart?: (payload: { sessionId: string; toolName: string; label: string }) => void;
    onToken?: (payload: { chunk: string; sessionId: string }) => void;
    onComplete?: (payload: { sessionId: string; intent?: string }) => void;
    onError?: (payload: { code: string; message: string }) => void;
  },
) => {
  const socket = await ensureAISocket(accessToken);
  if (handlers.onThinking) socket.on('ai:thinking', handlers.onThinking);
  if (handlers.onToolStart) socket.on('ai:tool_start', handlers.onToolStart);
  if (handlers.onToken) socket.on('ai:token', handlers.onToken);
  if (handlers.onComplete) socket.on('ai:complete', handlers.onComplete);
  if (handlers.onError) socket.on('ai:error', handlers.onError);

  return () => {
    if (handlers.onThinking) socket.off('ai:thinking', handlers.onThinking);
    if (handlers.onToolStart) socket.off('ai:tool_start', handlers.onToolStart);
    if (handlers.onToken) socket.off('ai:token', handlers.onToken);
    if (handlers.onComplete) socket.off('ai:complete', handlers.onComplete);
    if (handlers.onError) socket.off('ai:error', handlers.onError);
  };
};

// ── REST: lịch sử session ─────────────────────────────────────────────────
export interface AISessionSummary {
  id: string;
  mode: AIMode;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  _count?: { messages: number };
}

export const fetchAISessions = async (accessToken: string): Promise<AISessionSummary[]> => {
  const { data } = await api.get('/ai/sessions', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return Array.isArray(data) ? data : [];
};

export interface AIHistoryMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  created_at: string;
}

export const fetchAISession = async (
  accessToken: string,
  sessionId: string,
): Promise<{ id: string; messages: AIHistoryMessage[] }> => {
  const { data } = await api.get(`/ai/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    id: data?.id,
    messages: Array.isArray(data?.messages) ? data.messages : [],
  };
};
