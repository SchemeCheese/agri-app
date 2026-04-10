"use client";

import React, { useState } from 'react';
import { MessageCircle, Bot, Store, X, TicketPercent } from 'lucide-react';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Menu Chat */}
      {isOpen && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-72 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="p-3 border-b border-gray-100">
             <h4 className="font-bold text-gray-800">Hỗ trợ khách hàng</h4>
             <p className="text-xs text-gray-500">Chúng tôi sẵn sàng giúp đỡ bạn</p>
          </div>
          
          <div className="flex flex-col gap-1 p-2">
            <button className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-xl transition-colors text-left group">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Bot size={20} />
              </div>
              <div>
                <span className="block font-semibold text-sm text-gray-800">Trợ lý AI AgriBot</span>
                <span className="text-xs text-gray-500">Hỏi đáp tự động 24/7</span>
              </div>
            </button>

            <button className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-xl transition-colors text-left group">
              <div className="bg-orange-100 p-2 rounded-full text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Store size={20} />
              </div>
              <div>
                <span className="block font-semibold text-sm text-gray-800">Chat với Shop</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <TicketPercent size={12} className="text-red-500"/>
                  Xem tin nhắn & ưu đãi
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Nút Chat Chính */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-green-200"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
           <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
};