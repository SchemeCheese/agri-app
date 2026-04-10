import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import storage from './storage';

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (payload: { user: AuthUser; accessToken: string }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-store',
      storage,
    },
  ),
);
