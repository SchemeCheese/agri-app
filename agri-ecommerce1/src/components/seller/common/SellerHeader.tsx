"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';

export const SellerHeader = () => {
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    api.get('/profile/me')
      .then(res => {
        const name = res.data?.profile?.store_name || res.data?.full_name || 'Shop của bạn';
        setStoreName(name);
      })
      .catch(() => setStoreName('Shop của bạn'));
  }, []);

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50">
      
      {/* Breadcrumb / Title Context */}
      <div>
         <h2 className="text-xl font-bold text-gray-800">Xin chào, {storeName || '...'} 👋</h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5">
        {/* Search nhỏ */}
        <div className="hidden md:flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 w-64 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
           <Search size={16} className="text-gray-400" />
           <input type="text" placeholder="Tìm kiếm..." className="bg-transparent border-none outline-none text-sm ml-2 w-full" />
        </div>

        <button className="relative p-2.5 bg-white rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 shadow-sm border border-gray-100 transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200"></div>

        <button className="flex items-center gap-3 pl-1 pr-2 py-1 bg-white rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            NC
          </div>
          <ChevronDown size={16} className="text-gray-400 mr-1" />
        </button>
      </div>
    </header>
  );
};