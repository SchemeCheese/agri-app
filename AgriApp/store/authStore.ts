import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import storage from './storage';
import { disconnectChatSocket } from '@/services/chatSocket';
import { disconnectAISocket } from '@/services/aiSocket';

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

// BE returns is_buyer / is_seller / is_admin booleans. We also derive a single
// `role` so existing screens that do `user.role === 'SELLER'` keep working —
// without it, every logged-in seller silently fell through to the buyer-orders
// endpoint and saw an empty history.
export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_buyer?: boolean;
  is_seller?: boolean;
  is_admin?: boolean;
  avatar?: string;
};

export const normalizeAuthUser = (raw: any): AuthUser => {
  const is_buyer = !!raw?.is_buyer;
  const is_seller = !!raw?.is_seller;
  const is_admin = !!raw?.is_admin;
  // Existing API responses already carried a `role` field in some shapes (e.g.
  // a few cached payloads) — preserve it as a fallback for forward-compat.
  const explicitRole = raw?.role as UserRole | undefined;
  const role: UserRole = is_admin
    ? 'ADMIN'
    : is_seller
      ? 'SELLER'
      : explicitRole && ['BUYER', 'SELLER', 'ADMIN'].includes(explicitRole)
        ? explicitRole
        : 'BUYER';
  return {
    id: raw.id,
    email: raw.email,
    full_name: raw.full_name,
    role,
    is_buyer,
    is_seller,
    is_admin,
    avatar: raw.avatar || undefined,
  };
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (payload: { user: any; accessToken: string }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user: normalizeAuthUser(user), accessToken }),
      logout: () => {
        disconnectChatSocket();
        disconnectAISocket();
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: 'auth-store',
      storage,
    },
  ),
);
