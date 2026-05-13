import api from './client';

export type BehaviorAction =
  | 'VIEW_PRODUCT'
  | 'SEARCH'
  | 'ADD_TO_CART'
  | 'START_CHAT'
  | 'PURCHASE';

type TrackBehaviorPayload = {
  userId?: string;
  sessionId?: string;
  action: BehaviorAction;
  targetId?: string;
  metadata?: Record<string, unknown>;
  weight?: number;
};

const SESSION_STORAGE_KEY = 'behavior-session-id';
let runtimeSessionId: string | null = null;

const generateSessionId = () => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `sess_${Date.now()}_${rand}`;
};

const getSessionId = async () => {
  if (runtimeSessionId) return runtimeSessionId;

  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      runtimeSessionId = existing;
      return existing;
    }

    const created = generateSessionId();
    runtimeSessionId = created;
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  }

  const storage = await import('@react-native-async-storage/async-storage');
  const existing = await storage.default.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    runtimeSessionId = existing;
    return existing;
  }

  const created = generateSessionId();
  runtimeSessionId = created;
  await storage.default.setItem(SESSION_STORAGE_KEY, created);
  return created;
};

export const trackBehavior = async (
  payload: Omit<TrackBehaviorPayload, 'sessionId'>,
  accessToken?: string | null,
) => {
  const sessionId = await getSessionId();

  const body: TrackBehaviorPayload = {
    ...payload,
    sessionId,
  };

  await api.post('/behaviors', body, {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });
};
