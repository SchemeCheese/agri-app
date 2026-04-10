// src/components/home/DailySuggestions.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { ProductCard } from './ProductCard';
import { Sparkles, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/vi';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/runtime-config';

const fixImg = (url: string) => resolveImageUrl(url);

export const DailySuggestions = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products')
      .then(res => {
        // Lấy 8 sản phẩm ngẫu nhiên làm gợi ý
        const shuffled = [...res.data].sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 8));
      })
      .catch(err => console.error('DailySuggestions fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Sparkles className="text-yellow-500 w-6 h-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-900">Gợi Ý Hôm Nay</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-green-600" size={32}/>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
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
        ) : (
          <p className="text-center text-gray-500">Chưa có sản phẩm nào.</p>
        )}
      </Container>
    </section>
  );
};
