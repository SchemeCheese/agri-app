// src/components/layouts/Footer.tsx
import React from 'react';
import { Container } from '@/components/ui/Container';

export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột 1: Logo & Giới thiệu */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Agri-Ecommerce</h3>
            <p className="text-sm">
              Mang nông sản sạch từ nông trại đến bàn ăn của bạn.
            </p>
          </div>
          
          {/* Cột 2: Liên kết nhanh */}
          <div>
            <h4 className="text-md font-semibold text-white mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="products" className="hover:text-white">Sản phẩm</a></li>
              <li><a href="about" className="hover:text-white">Về chúng tôi</a></li>
              <li><a href="contact" className="hover:text-white">Liên hệ</a></li>
              <li><a href="#" className="hover:text-white">Chính sách</a></li>
            </ul>
          </div>
          
          {/* Cột 3: Liên hệ */}
          <div>
            <h4 className="text-md font-semibold text-white mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: contact@agri.com</li>
              <li>Phone: 0123 456 789</li>
              <li>Địa chỉ: 123, Hà Nội, Việt Nam</li>
            </ul>
          </div>
          
          {/* Cột 4: Mạng xã hội */}
          <div>
            <h4 className="text-md font-semibold text-white mb-4">Theo dõi chúng tôi</h4>
             {/* Thêm icons mạng xã hội tại đây */}
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} Agri-Ecommerce. Đã đăng ký bản quyền.
        </div>
      </Container>
    </footer>
  );
};