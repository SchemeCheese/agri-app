// src/app/(seller)/layout.tsx
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { SellerSidebar } from '@/components/seller/common/SellerSidebar';
import { SellerHeader } from '@/components/seller/common/SellerHeader';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login'); 
      } else if (user.role !== 'SELLER') {
        router.push('/'); 
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'SELLER') {
    return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900">
      <SellerSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <SellerHeader />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}