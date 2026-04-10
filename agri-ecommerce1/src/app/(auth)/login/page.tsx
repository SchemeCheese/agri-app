// src/app/(auth)/login/page.tsx
"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, ArrowRight, User, Store } from 'lucide-react';

function LoginContent() {
  const router = useRouter(); 
  const searchParams = useSearchParams(); 
  const returnUrl = searchParams.get('returnUrl'); // Lấy đường dẫn cũ (nếu có)
  
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Gọi hàm login từ Context 
    const success = await login(formData.email, formData.password);
    
    if (success) {
      // Nếu có returnUrl (ví dụ từ giỏ hàng chuyển sang) thì quay lại đó
      if (returnUrl) {
         router.push(returnUrl);
      }
      // Nếu không có, Context đã tự động xử lý redirect (Buyer -> Home, Seller -> Dashboard)
    } else {
      setError('Email hoặc mật khẩu không chính xác!');
      setLoading(false);
    }
  };

  const fillCredential = (type: 'buyer' | 'seller') => {
    if (type === 'buyer') {
      setFormData({ email: 'khach@gmail.com', password: '123456' }); // Sửa lại pass cho khớp với file seed.ts
    } else {
      setFormData({ email: 'shop2@gmail.com', password: '123456' }); // Tài khoản seller shop-2 để test
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans"> 
      
      {/* --- CỘT TRÁI: ẢNH --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-900">
        <Image 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop" 
          alt="Agriculture" 
          fill
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Thực phẩm sạch <br/> Cho cuộc sống xanh</h2>
          <p className="text-lg opacity-90">Kết nối nông sản Việt trực tiếp từ nông trại đến bàn ăn của gia đình bạn.</p>
        </div>
      </div>

      {/* --- CỘT PHẢI: FORM --- */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-gray-50 lg:bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-sans">
              Chào mừng trở lại!
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-sans">
              Vui lòng đăng nhập để quản lý đơn hàng và thanh toán.
            </p>
          </div>

          {/* --- NÚT TEST NHANH --- */}
          <div className="grid grid-cols-2 gap-3 mb-4">
             <button type="button" onClick={() => fillCredential('buyer')} className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition border border-blue-100">
                <User size={16} /> Test Khách
             </button>
             <button type="button" onClick={() => fillCredential('seller')} className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition border border-green-100">
                <Store size={16} /> Test Chủ Shop
             </button>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={20} />
                </div>
                <input
                  required
                  type="email"
                  placeholder="Email của bạn"
                  className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  required
                  type="password"
                  placeholder="Mật khẩu"
                  className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Hiển thị lỗi nếu có */}
            {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">Ghi nhớ</label>
              </div>
              <a href="#" className="text-sm font-medium text-green-600 hover:text-green-500 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg shadow-green-200 disabled:opacity-70"
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP NGAY'}
              {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="text-center mt-6">
             <p className="text-sm text-gray-600">
               Chưa có tài khoản?{' '}
               <Link href="/register" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
                 Đăng ký miễn phí
               </Link>
             </p>
          </div>

           <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 lg:bg-white text-gray-500">Hoặc tiếp tục với</span></div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex justify-center items-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="font-medium text-sm text-gray-700">Google</span>
              </button>

              <button className="flex justify-center items-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white">
                 <svg className="h-5 w-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                 </svg>
                 <span className="font-medium text-sm text-gray-700">Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  )
}