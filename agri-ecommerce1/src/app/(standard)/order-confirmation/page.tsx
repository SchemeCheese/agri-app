"use client";

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã mua sắm tại AgriStore. Mã đơn hàng của bạn là <span className="font-bold text-black">#ORD-{Math.floor(Math.random() * 10000)}</span>.
        </p>
        
        <div className="bg-green-50 p-4 rounded-lg mb-8 text-sm text-green-800">
          Chúng tôi sẽ liên hệ sớm nhất để xác nhận đơn hàng và thời gian giao hàng.
        </div>

        <div className="space-y-3">
          <Link 
            href="/products" 
            className="block w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition"
          >
            Tiếp tục mua sắm
          </Link>
          <Link 
            href="/" 
            className="block w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}