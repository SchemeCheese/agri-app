// src/components/home/Promotions.tsx
import React from 'react';
import { Container } from '@/components/ui/Container';
import Image from 'next/image';
import { ArrowRight, Tag } from 'lucide-react';

export const Promotions = () => {
  return (
    // SỬA: Thêm class 'font-sans' để sửa lỗi hiển thị font
    <section id="promotions" className="py-20 bg-gray-50 font-sans">
      <Container>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-12">
            
            {/* Cột Nội Dung */}
            <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center relative z-10">
              {/* Hiệu ứng nền mờ (Blobs) */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Hot Deal
                </span>
                <span className="text-gray-500 text-sm font-medium">Chỉ còn 2 ngày</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Giảm <span className="text-green-600">20%</span> toàn bộ <br/>
                Rau củ hữu cơ
              </h2>

              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Nhập mã <span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 border-dashed">RAUSACH20</span> để nhận ưu đãi cho đơn hàng đầu tiên.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2">
                  Mua ngay
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-3.5 rounded-full font-semibold text-green-700 border border-green-200 hover:bg-green-50 transition-colors">
                  Xem chi tiết
                </button>
              </div>
            </div>

            {/* Cột Hình Ảnh */}
            <div className="md:col-span-5 relative min-h-[300px] md:min-h-full">
              <Image
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
                alt="Rau củ tươi khuyến mãi"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent md:bg-gradient-to-l opacity-20 md:opacity-100"></div>
            </div>

          </div>
        </div>
      </Container>
    </section>
  );
};