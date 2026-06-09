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
  // Workspace đang dùng (BE ký vào JWT). Quyết định UI tab buyer/seller.
  activeRole?: UserRole;
  // Các vai trò user sở hữu — dùng để hiện nút "Đổi vai trò".
  allowedRoles?: UserRole[];
  avatar?: string;
};

const VALID_ROLES: UserRole[] = ['BUYER', 'SELLER', 'ADMIN'];

export const normalizeAuthUser = (raw: any): AuthUser => {
  const is_buyer = !!raw?.is_buyer;
  const is_seller = !!raw?.is_seller;
  const is_admin = !!raw?.is_admin;
  const activeRole = VALID_ROLES.includes(raw?.activeRole) ? (raw.activeRole as UserRole) : undefined;
  const allowedRoles: UserRole[] = Array.isArray(raw?.allowedRoles)
    ? raw.allowedRoles.filter((r: any) => VALID_ROLES.includes(r))
    : [is_buyer && 'BUYER', is_seller && 'SELLER', is_admin && 'ADMIN'].filter(Boolean) as UserRole[];
  // `role` = workspace HIỆN TẠI. Ưu tiên activeRole (BE ký) để một seller đang ở
  // workspace BUYER vẫn thấy UI mua hàng. Token cũ chưa có activeRole → suy từ flags.
  const explicitRole = VALID_ROLES.includes(raw?.role) ? (raw.role as UserRole) : undefined;
  const role: UserRole = activeRole
    ?? (is_admin ? 'ADMIN' : is_seller ? 'SELLER' : explicitRole ?? 'BUYER');
  return {
    id: raw.id,
    email: raw.email,
    full_name: raw.full_name,
    role,
    is_buyer,
    is_seller,
    is_admin,
    activeRole,
    allowedRoles,
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
