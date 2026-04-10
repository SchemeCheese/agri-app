"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/home/ProductCard';
import { formatCurrency } from '@/utils/vi';
import { Loader2, Store, Star, Package } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

const BACKEND_URL = 'http://localhost:3001';
const fixImg = (url: string) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.get('/search', { params: { q: query } })
      .then(res => {
        setShops(res.data.shops || []);
        setProducts(res.data.products || []);
      })
      .catch(err => console.error('Search error:', err))
      .finally(() => setLoading(false));
  }, [query]);

  const totalCount = shops.length + products.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Kết quả cho: &quot;<span className="text-green-600">{query}</span>&quot;
        </h1>
        {!loading && query && (
          <p className="text-sm text-gray-500 mt-1">Tìm thấy {totalCount} kết quả</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-green-600" size={32}/>
        </div>
      ) : totalCount === 0 && query ? (
        <div className="text-center py-20 bg-white rounded-xl border shadow-sm">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">Không tìm thấy kết quả nào.</p>
          <p className="text-gray-400 text-sm mt-1">Thử tìm với từ khóa khác.</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* === KHU VỰC SHOP (ưu tiên hiển thị trước) === */}
          {shops.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Store className="text-green-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Shop ({shops.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {shops.map((shop: any) => (
                  <Link key={shop.id} href={`/shop/${shop.id}`}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all flex flex-col items-center text-center group">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-green-100 bg-green-50 mb-3 flex items-center justify-center">
                      {shop.avatar_url
                        ? <img src={fixImg(shop.avatar_url)} alt={shop.store_name} className="w-full h-full object-cover" />
                        : <Store size={24} className="text-green-600" />
                      }
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-green-700 transition-colors line-clamp-1">{shop.store_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {Number(shop.rating ?? 0).toFixed(1)}
                      <span className="text-gray-400 font-normal">({shop.total_reviews ?? 0} đánh giá)</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{shop.product_count} sản phẩm</p>
                    <span className="mt-2 text-[10px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-semibold">Xem shop →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* === KHU VỰC SẢN PHẨM === */}
          {products.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Package className="text-green-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Sản phẩm ({products.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.id}
                    imageUrl={fixImg(product.images?.[0] ?? '')}
                    title={product.name}
                    description={product.description}
                    price={formatCurrency(product.price)}
                    rawPrice={product.price}
                    unit={product.unit}
                    sellerId={product.seller_id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32}/></div>}>
      <SearchContent />
    </Suspense>
  );
}
