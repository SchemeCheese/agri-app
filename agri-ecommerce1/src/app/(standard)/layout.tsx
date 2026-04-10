"use client"; 

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; 
import { Header } from "@/components/layouts/Header";
import HeaderSecondary from "@/components/layouts/HeaderSecondary";
import { Footer } from "@/components/layouts/Footer";

export default function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname(); 

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // CHỈ NHỮNG TRANG NÀY MỚI DÙNG HEADER TRONG SUỐT (Vì chúng đã có Banner ảnh che chở)
  // Loại bỏ '/products/' (nếu nó chứa slug) để trang chi tiết dùng Header trắng
  const useTransparent = 
    pathname === '/' || 
    pathname === '/about' || 
    pathname === '/contact' || 
    pathname === '/products'; // Trang danh sách sản phẩm

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {useTransparent ? (
        <Header isScrolled={isScrolled} logoSrc={isScrolled ? '/logos/agri-connect-large-dark.svg' : '/logos/agri-connect-large-light.svg'} />
      ) : (
        <HeaderSecondary />
      )}
      
      <main className="flex-grow">
        {children}
      </main>

      <Footer />
    </div>
  );
}