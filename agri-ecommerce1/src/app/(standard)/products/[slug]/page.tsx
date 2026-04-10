import React from 'react';
import { notFound } from 'next/navigation';
import axios from 'axios';
import ProductClient from './ProductClient';
import { API_BASE_URL } from '@/lib/runtime-config';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug } = await params;
  if (!slug) return notFound();
  
  try {
    // Cho phép 404 mà không throw để tự kiểm soát
    const detailRes = await axios.get(`${API_BASE_URL}/products/${encodeURIComponent(slug)}`, {
      validateStatus: () => true,
    });
    if (detailRes.status !== 200) return notFound();
    const product = detailRes.data;

    const allRes = await axios.get(`${API_BASE_URL}/products`, { validateStatus: () => true });
    const allProducts = allRes.status === 200 ? allRes.data : [];

    if (!product) return notFound();

    return (
      <div className="container mx-auto px-4 py-8">
        <ProductClient product={product} allProducts={allProducts} />
      </div>
    );
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    return notFound();
  }
}