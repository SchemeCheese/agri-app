// src/components/seller/common/SellerSidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 1. Import Context
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Package, PackagePlus, MessageSquare, 
  LogOut, Star, Store, ShoppingBag, Ticket
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', href: '/dashboard' },
  { icon: <ShoppingBag size={20} />, label: 'Đơn hàng', href: '/dashboard/orders' },
  { icon: <Package size={20} />, label: 'Sản phẩm', href: '/dashboard/products' },
  { icon: <PackagePlus size={20} />, label: 'Thêm mới', href: '/dashboard/products/create' },
  { icon: <Ticket size={20} />, label: 'Mã giảm giá', href: '/dashboard/vouchers' },
  { icon: <Star size={20} />, label: 'Đánh giá', href: '/dashboard/reviews' },
  { icon: <Store size={20} />, label: 'Hồ sơ Shop', href: '/dashboard/shop' },
  { icon: <MessageSquare size={20} />, label: 'Chat', href: '/seller-chat' },
];

export const SellerSidebar = () => {
  const pathname = usePathname();
  // 2. Lấy hàm logout từ Context
  const { logout } = useAuth();

  // 3. Hàm xử lý đăng xuất
  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Kênh Người Bán?')) {
      logout();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-600/20">
          <Store size={22} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg leading-tight">Seller Center</h1>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Agri Connect</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4 custom-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive 
                  ? 'bg-green-50 text-green-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer Sidebar - Nút Đăng Xuất */}
      <div className="p-4 border-t border-gray-50 mx-4 mb-4">
        <button 
          onClick={handleLogout} // 4. Gắn sự kiện vào nút
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full text-sm font-bold transition-colors"
        >
          <LogOut size={20} /> Đăng xuất
        </button>
      </div>
    </aside>
  );
};