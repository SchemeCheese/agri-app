'use client';

import { useState, useEffect } from 'react';
import { User, ShoppingCart, Menu, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';

const LOGO_LIGHT = '/logos/agri-connect-large-light.svg';
const LOGO_DARK = '/logos/agri-connect-large-dark.svg';

// 1. THÊM INTERFACE NÀY
interface HeaderSecondaryProps {
  title?: string;
}

// 2. SỬA DÒNG NÀY: Chuyển sang export default và nhận { title }
export default function HeaderSecondary({ title }: HeaderSecondaryProps) {
  const { user, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { carts, activeUserId } = useCartStore();
  const items = carts[activeUserId] || [];

  const cartItemCount = items.length;

  const navLinks = [
    { href: '/', text: t('home') },
    { href: '/products', text: t('products') },
    { href: '/about', text: t('about') },
    { href: '/contact', text: t('contact') },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isSeller = user?.role === 'SELLER';

  const logoSrc = LOGO_DARK;

  return (
    <header className="bg-white shadow-sm h-16 flex items-center sticky top-0 z-30">
      <Container className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* LOGO */}
          <Link href="/" className="flex-shrink-0">
            <Image src={logoSrc} alt="Agri Connect" width={160} height={40} className="h-10 w-auto" />
          </Link>

          {/* 3. THÊM DÒNG NÀY: Hiển thị tiêu đề trang nếu có */}
          {title && (
            <>
              <div className="h-6 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>
              <h1 className="text-lg font-bold text-gray-800 hidden md:block">{title}</h1>
            </>
          )}
        </div>

        {/* DESKTOP NAV (Phần này giữ nguyên code của bạn) */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link key={link.text} href={link.href} className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors">
              {link.text}
            </Link>
          ))}

          <button
            onClick={() => changeLanguage(currentLanguage === 'vi' ? 'en' : 'vi')}
            className="text-sm font-semibold uppercase text-gray-700 hover:text-green-600"
          >
            {currentLanguage}
          </button>

          <Link href="/cart" className="flex items-center space-x-1 relative text-gray-700 hover:text-green-600">
            <ShoppingCart size={20} />
            {mounted && cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center border-2 border-white">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </Link>

          {mounted && user ? (
            <div className="relative group">
              <Link href={isSeller ? '/dashboard' : '/profile'} className="flex items-center space-x-2 pl-2 border-l border-gray-300 cursor-pointer text-gray-700 hover:text-green-600">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm border border-green-200 shadow-sm overflow-hidden relative">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.full_name} fill className="object-cover" />
                  ) : (
                    (user.full_name?.charAt(0).toUpperCase() || 'U')
                  )}
                </div>
                <span className="hidden lg:inline text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user.full_name}
                </span>
                <ChevronDown size={14} />
              </Link>

              <div className="absolute right-0 top-full pt-4 w-48 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-1 overflow-hidden">
                  <Link href={isSeller ? '/dashboard' : '/profile'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg">
                    Hồ sơ của tôi
                  </Link>
                  {isSeller && (
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg">
                      Quản lý Shop
                    </Link>
                  )}
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="flex items-center space-x-1 text-gray-700 hover:text-green-600">
              <User size={20} />
              <span className="hidden lg:inline text-sm">{t('login_register')}</span>
            </Link>
          )}
        </nav>

        {/* MOBILE TOGGLE (Giữ nguyên code của bạn) */}
        <div className="md:hidden flex items-center space-x-4">
          <Link href="/cart" className="flex items-center relative text-gray-700 hover:text-green-600">
            <ShoppingCart size={20} />
            {mounted && cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>
      </Container>

      {/* MOBILE MENU (Giữ nguyên code của bạn) */}
      <div className={cn(
        "md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg transition-all duration-300 ease-in-out overflow-hidden",
        isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <nav className="flex flex-col p-4 space-y-2 border-t border-gray-100">
          {navLinks.map((link) => (
            <Link
              key={link.text}
              href={link.href}
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-green-600"
            >
              {link.text}
            </Link>
          ))}
          {/* ... các phần còn lại của Mobile Menu giữ nguyên ... */}
        </nav>
      </div>
    </header>
  );
}