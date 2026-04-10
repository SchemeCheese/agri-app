// src/app/(standard)/contact/page.tsx
'use client'; 

import React from 'react';
import Image from 'next/image'; // Đã thêm import Image
import { Container } from '@/components/ui/Container';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 1. BANNER NẰM TRÊN CÙNG (Không bị dính padding) */}
      <div className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center">
        <Image 
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Contact Banner" 
          fill 
          className="object-cover"
        />
        <div className="absolute inset-0 bg-green-900/60"></div> 
        <div className="relative z-10 text-center text-white mt-16 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Liên Hệ Với Chúng Tôi</h1>
          <p className="text-lg opacity-90">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Gửi thắc mắc của bạn hoặc ghé thăm văn phòng của chúng tôi</p>
        </div>
      </div>

      {/* 2. NỘI DUNG CHÍNH NẰM DƯỚI (Đẩy padding vào khối này) */}
      <div className="bg-white py-16 md:py-24">
        <Container>
          {/* <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800">Liên Hệ Với Chúng Tôi</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn lòng lắng nghe! Gửi thắc mắc của bạn cho chúng tôi,
              hoặc ghé thăm văn phòng của chúng tôi.
            </p>
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Cột Form */}
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Gửi tin nhắn cho chúng tôi</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Hỗ trợ về đơn hàng..."
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung tin nhắn
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Nội dung chi tiết..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors"
                  >
                    Gửi Tin Nhắn
                  </button>
                </div>
              </form>
            </div>

            {/* Cột Thông tin */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Thông tin liên hệ</h2>
                <div className="space-y-6 text-gray-600">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Địa chỉ</h3>
                      <p className="mt-1">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Điện thoại</h3>
                      <p className="mt-1">(+84) 123 456 789</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                      <p className="mt-1">hotro@agri-ecommerce.vn</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Vị trí của chúng tôi</h2>
                <div className="w-full h-72 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 overflow-hidden">
                  (Bản đồ Google Map sẽ được nhúng ở đây)
                </div>
              </div>
            </div>
            
          </div>
        </Container>
      </div>
    </div>
  );
}