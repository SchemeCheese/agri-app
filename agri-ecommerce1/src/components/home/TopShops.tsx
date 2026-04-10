// src/components/home/TopShops.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Star, Store, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/runtime-config';

const fixImg = (url: string) => resolveImageUrl(url) || '';

export const TopShops = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shops/top', { params: { limit: 4, sort: 'sales' } })
      .then(res => {
        const data: any[] = Array.isArray(res.data) ? res.data : [];
        setShops(data.map(s => ({
          id: s.id,
          name: s.store_name || 'Agri Shop',
          avatar: fixImg(s.avatar_url || ''),
          rating: s.avg_rating ?? 5,
          highlight: s.store_address || 'Nông sản sạch',
          totalSales: s.total_sales ?? 0,
          totalReviews: s.total_reviews ?? 0,
        })));
      })
      .catch(err => console.error('TopShops error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="py-12 bg-gray-50">
      <Container>
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-green-600" size={28}/>
        </div>
      </Container>
    </section>
  );

  if (shops.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <Container>
        <div className="flex items-center gap-2 mb-6">
          <Store className="text-green-600 w-6 h-6" />
          <h2 className="font-bold text-2xl text-gray-900">Shop Nổi Bật Hàng Đầu</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {shops.map((shop) => (
            <Link key={shop.id} href={`/shop/${shop.id}`}
              className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center group"
            >
              <div className="relative w-20 h-20 mb-4 rounded-full overflow-hidden border-2 border-green-100 bg-green-50 flex items-center justify-center">
                {shop.avatar ? (
                  <img src={shop.avatar} alt={shop.name} className="w-full h-full object-cover rounded-full"/>
                ) : (
                  <Store className="text-green-600 w-8 h-8"/>
                )}
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center shadow-sm">
                  {shop.rating} <Star className="w-3 h-3 fill-white ml-0.5" />
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-green-700 transition-colors line-clamp-1">{shop.name}</h3>
              <p className="text-xs text-gray-400 mb-1">{shop.totalReviews} đánh giá · {shop.totalSales} đã bán</p>
              <p className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium line-clamp-1">
                {shop.highlight}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
