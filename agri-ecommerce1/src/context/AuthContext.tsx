"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

import { useCartStore } from '@/store/useCartStore';
import { API_BASE_URL } from '@/lib/runtime-config';

// Định nghĩa User khớp với Backend
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const API_URL = API_BASE_URL;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Khôi phục phiên đăng nhập khi F5 trang
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('agri_user');
        const token = localStorage.getItem('access_token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // ---> THÊM MỚI 1: Khi F5 load lại trang, gán đúng giỏ hàng của User này
          useCartStore.getState().setActiveUser(parsedUser.id);

          // Logic bảo vệ route: Nếu là Seller mà đang ở trang Buyer -> Đẩy về Dashboard
          if (parsedUser.role === 'SELLER' && !pathname.startsWith('/dashboard')) {
             // router.replace('/dashboard'); 
          }
        } else {
          // ---> THÊM MỚI 2: Nếu chưa đăng nhập, đảm bảo giỏ hàng là của Guest
          useCartStore.getState().setActiveUser('guest');
        }
      } catch (error) {
        console.error("Lỗi khôi phục phiên:", error);
        logout(); // Nếu dữ liệu lỗi thì đăng xuất luôn
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Hàm Login: Sửa lại Logic điều hướng
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        password: pass,
      });

      const { access_token, user } = response.data;

      // Lưu storage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('agri_user', JSON.stringify(user));
      setUser(user);

      // ---> THÊM MỚI 3: Vừa đăng nhập xong -> Chuyển từ Guest sang User, đồng thời gộp giỏ hàng!
      useCartStore.getState().setActiveUser(user.id);

      // --- LOGIC REDIRECT QUAN TRỌNG ---
      // 1. Chuyển role về chữ in hoa để so sánh cho chắc chắn
      const role = user.role?.toUpperCase(); 

      // 2. Điều hướng
      if (role === 'SELLER') {
        console.log("Là Seller -> Vào Dashboard"); // Log để debug
        router.push('/dashboard'); 
      } else if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        console.log("Là Buyer -> Vào Home"); // Log để debug
        router.push('/');
      }
      
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Hàm Logout: Xóa sạch và chuyển trang
  const logout = () => {
    setUser(null);
    localStorage.removeItem('agri_user');
    localStorage.removeItem('access_token');
    
    // ---> THÊM MỚI 4: Vừa đăng xuất -> Chuyển giỏ hàng về lại chế độ Guest (Trống)
    useCartStore.getState().setActiveUser('guest');
    
    // Dùng replace để không back lại được
    router.replace('/login'); 
    
    // Reload nhẹ để reset state của các component khác nếu cần
    setTimeout(() => {
        window.location.href = '/login';
    }, 100);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);