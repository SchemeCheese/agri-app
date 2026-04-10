"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ProductCard } from '@/components/home/ProductCard';
import { formatCurrency } from '@/utils/vi';
import { 
  UserPlus, MessageCircle, Star, MapPin, 
  Store, Clock, Ticket, Filter, LayoutGrid, Tag, CheckCircle2, Loader2
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import api from '@/lib/axios';

const BACKEND_URL = 'http://localhost:3001';
const fixImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

interface ShopClientProps {
  shop: any;
  products: any[];
}

export default function ShopClient({ shop, products }: ShopClientProps) {
  
  // 1. Logic lọc sản phẩm theo yêu cầu
  
  // Top 6 Đánh giá cao nhất (Sắp xếp theo rating giảm dần)
  const topRatedProducts = useMemo(() => 
    [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6)
  , [products]);

  // Top 6 Bán chạy nhất (Sắp xếp theo sold giảm dần)
  const bestSellingProducts = useMemo(() => 
    [...products].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 6)
  , [products]);

  // Hàng mới (Trong vòng 30 ngày)
  const newArrivals = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return products.filter(p => {
      const d = p.created_at || p.createdAt;
      return d && new Date(d) > oneMonthAgo;
    });
  }, [products]);

  // Danh mục sản phẩm CỦA RIÊNG SHOP (để hiển thị sidebar bên trái)
  const shopCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // State lọc cho phần "Tất cả sản phẩm"
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // State và fetch Voucher
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (shop.id) {
      api.get(`/vouchers/shop/${shop.id}`)
        .then(res => setVouchers(Array.isArray(res.data) ? res.data : []))
        .catch(() => setVouchers([]));
    }
  }, [shop.id]);

  const handleSaveVoucher = async (voucherId: string) => {
    setSavingId(voucherId);
    try {
      await api.post(`/vouchers/save/${voucherId}`);
      setSavedIds(prev => new Set([...prev, voucherId]));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu voucher.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredAllProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);


  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      
      {/* --- PHẦN 1: HEADER SHOP --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Background Cover (Giả lập mờ) */}
        <div className="h-32 bg-gradient-to-r from-green-600 to-teal-500 relative">
           <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-end md:items-center -mt-10 gap-6">
            
            {/* Avatar & Actions */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-green-50">
                {fixImg(shop.avatar)
                  ? <Image src={fixImg(shop.avatar)} alt={shop.name} fill className="object-cover" />
                  : <Store className="w-14 h-14 text-green-600 m-auto mt-6" />
                }
              </div>
              <h1 className="mt-3 text-xl font-bold text-gray-900">{shop.name}</h1>
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-1 bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-700 transition shadow-sm">
                  <UserPlus size={16} /> Theo dõi
                </button>
                <button className="flex items-center gap-1 bg-white text-green-600 border border-green-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-50 transition">
                  <MessageCircle size={16} /> Chat
                </button>
              </div>
            </div>

            {/* Shop Stats */}
            <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 md:mt-0 md:ml-8 md:border-l md:pl-8 border-gray-200">
                <StatItem icon={<Store size={18}/>} label="Sản phẩm" value={shop.totalProducts || products.length} />
                <StatItem icon={<UserPlus size={18}/>} label="Người theo dõi" value={shop.followers} />
                <StatItem icon={<Star size={18}/>} label="Đánh giá" value={`${shop.rating} / 5.0`} />
                <StatItem icon={<MessageCircle size={18}/>} label="Phản hồi Chat" value={shop.responseRate} />
                <StatItem icon={<Clock size={18}/>} label="Tham gia" value={shop.joinDate} />
                <StatItem icon={<MapPin size={18}/>} label="Địa chỉ" value={shop.location} isFull />
            </div>
          </div>
        </div>
      </div>

      {/* --- PHẦN 2: VOUCHER SHOP (real data) --- */}
      {vouchers.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Ticket className="text-orange-500" /> Mã Giảm Giá Của Shop
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.map((v: any) => {
              const isSaved = savedIds.has(v.id);
              const isSaving = savingId === v.id;
              const expired = v.valid_to && new Date(v.valid_to) < new Date();
              return (
                <div key={v.id}
                  className="relative flex items-stretch bg-orange-50 border border-orange-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                  {/* Left coupon strip */}
                  <div className="bg-orange-500 text-white flex flex-col items-center justify-center px-4 py-3 min-w-[80px] text-center flex-shrink-0">
                    <Tag size={20} className="mb-1" />
                    <span className="text-lg font-black leading-none">
                      {v.discount_type === 'PERCENT' ? `${v.discount_value}%` : `${Number(v.discount_value).toLocaleString()}đ`}
                    </span>
                    <span className="text-[10px] opacity-80">{v.discount_type === 'PERCENT' ? 'GIẢM' : 'GIẢM THẲNG'}</span>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-[68px] w-4 h-8 bg-white rounded-r-full border-r border-orange-200"/>
                  {/* Right content */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="font-black text-gray-800 tracking-widest text-sm">{v.code}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Đơn từ {Number(v.min_order_value).toLocaleString()}đ
                        {v.max_discount_amount > 0 && ` · Tối đa ${Number(v.max_discount_amount).toLocaleString()}đ`}
                      </p>
                      {v.valid_to && (
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={10}/> HSD: {new Date(v.valid_to).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSaveVoucher(v.id)}
                      disabled={isSaved || isSaving || expired}
                      className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                        isSaved
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : expired
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}>
                      {isSaving ? <Loader2 size={12} className="animate-spin" /> :
                        isSaved ? <><CheckCircle2 size={12}/> Đã lưu</> :
                        expired ? 'Hết hạn' : 'Lưu ngay'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PHẦN 3: GỢI Ý CHO BẠN (TOP RATED) --- */}
      <ProductSection title="Gợi ý cho bạn" subtitle="Sản phẩm được đánh giá cao nhất">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topRatedProducts.map(p => (
             <ProductCard key={p.id} {...mapProductToCard(p)} />
          ))}
        </div>
      </ProductSection>

      {/* --- PHẦN 4: BANNER 1 --- */}
      {shop.banners && shop.banners.length > 0 && (
        <div className="rounded-xl overflow-hidden shadow-sm">
           <ShopBanner images={shop.banners} />
        </div>
      )}

      {/* --- PHẦN 5: SẢN PHẨM BÁN CHẠY --- */}
      <ProductSection title="Sản phẩm bán chạy" subtitle="Top sản phẩm hot nhất tại shop">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {bestSellingProducts.map(p => (
             <ProductCard key={p.id} {...mapProductToCard(p)} />
          ))}
        </div>
      </ProductSection>

      {/* --- PHẦN 6: BANNER 2 --- */}
      {shop.banners2 && shop.banners2.length > 0 && (
        <div className="rounded-xl overflow-hidden shadow-sm">
           <ShopBanner images={shop.banners2} />
        </div>
      )}

      {/* --- PHẦN 7: HÀNG MỚI VỀ (Ẩn nếu không có) --- */}
      {newArrivals.length > 0 && (
        <ProductSection title="Hàng mới về" subtitle="Sản phẩm mới cập nhật tháng này">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {newArrivals.map(p => (
               <ProductCard key={p.id} {...mapProductToCard(p)} />
            ))}
          </div>
        </ProductSection>
      )}

      {/* --- PHẦN 8: TẤT CẢ SẢN PHẨM (LAYOUT 2 CỘT) --- */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Sidebar Danh mục (Bên trái) */}
        <div className="w-full md:w-64 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-4">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
             <LayoutGrid size={18} /> Danh mục Shop
           </h3>
           <div className="space-y-1">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${activeCategory === 'all' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Tất cả sản phẩm
              </button>
              {shopCategories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize transition ${activeCategory === cat ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat.replace('-', ' ')}
                </button>
              ))}
           </div>
        </div>

        {/* Grid Sản phẩm (Bên phải) */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Danh sách sản phẩm</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                 <Filter size={16} /> 
                 <span>Sắp xếp: Mặc định</span>
              </div>
           </div>
           
           {filteredAllProducts.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAllProducts.map(p => (
                   <ProductCard key={p.id} {...mapProductToCard(p)} />
                ))}
             </div>
           ) : (
             <div className="text-center py-20 text-gray-500">
               Không có sản phẩm nào trong danh mục này.
             </div>
           )}
        </div>

      </div>

    </div>
  );
}

// --- HELPER COMPONENTS ---

// 1. Hiển thị 1 chỉ số thống kê (Stat)
const StatItem = ({ icon, label, value, isFull = false }: any) => (
  <div className={`flex items-center gap-3 ${isFull ? 'col-span-2' : ''}`}>
    <div className="text-gray-400">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-green-700 truncate">{value}</p>
    </div>
  </div>
);

// 2. Khung Section có Title
const ProductSection = ({ title, subtitle, children }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="mb-6 border-l-4 border-green-600 pl-3">
      <h2 className="text-xl font-bold text-gray-800 uppercase">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// 3. Carousel Banner Shop
const ShopBanner = ({ images }: { images: string[] }) => (
  <Carousel className="w-full" opts={{ loop: true }}>
    <CarouselContent>
      {images.map((img, idx) => (
        <CarouselItem key={idx}>
          <div className="relative w-full h-[200px] md:h-[350px]">
            <Image src={img} alt="Shop Banner" fill className="object-cover" priority={idx === 0} />
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious className="left-4 bg-white/50 hover:bg-white text-gray-800 border-none" />
    <CarouselNext className="right-4 bg-white/50 hover:bg-white text-gray-800 border-none" />
  </Carousel>
);

// 4. Helper map data để dùng lại component ProductCard cũ
const mapProductToCard = (p: any) => ({
  id: p.id,
  imageUrl: fixImg(p.images?.[0] ?? ''),
  title: p.name,
  description: p.description ?? '',
  price: formatCurrency(p.price),
  rawPrice: p.price,
  slug: p.id,
  unit: p.unit,
});