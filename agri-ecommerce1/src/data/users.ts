// src/data/users.ts

export type UserRole = 'buyer' | 'seller';

export interface User {
  id: string;
  email: string;
  password: string; 
  name: string;
  role: UserRole;
  avatar: string;
  shopId?: string; 
}

export const MOCK_USERS: User[] = [
  // 1. Tài khoản KHÁCH HÀNG
  {
    id: 'u1',
    email: 'khach@gmail.com',
    password: '123',
    name: 'Khách Hàng A',
    role: 'buyer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'
  },
  // 2. Tài khoản CHỦ SHOP (Gán với shop-1 trong shops.ts)
  {
    id: 'u2',
    email: 'shop@gmail.com',
    password: '123',
    name: 'Nông Trại Cầu Đất',
    role: 'seller',
    avatar: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=100&auto=format&fit=crop',
    shopId: 'shop-1' 
  }
];