'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSellerProducts, SellerProduct, ProductFormData } from '@/hooks/useSellerProducts';
import { PageHeader } from '@/components/seller/common/PageHeader';
import { ProductForm } from '@/components/seller/products/ProductForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { fetchProductById, updateProduct } = useSellerProducts();
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const load = async () => {
      const resolvedParams = await params;
      const found = await fetchProductById(resolvedParams.id);
      if (found) setProduct(found);
      else setFetchError('Không tìm thấy sản phẩm');
    };
    load();
  }, [params]); // eslint-disable-line

  const handleUpdate = async (data: ProductFormData, imageFiles: File[]) => {
    if (!product) return;
    await updateProduct(product.id, data, imageFiles);
    router.push('/dashboard/products');
  };

  if (fetchError) return (
    <div className="text-center py-32 text-red-500">
      <p className="font-bold">{fetchError}</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-green-600 font-bold hover:underline">← Quay lại</button>
    </div>
  );
  if (!product) return <div className="flex justify-center items-center py-32"><Loader2 className="animate-spin text-green-500" size={36} /></div>;

  return (
    <div>
      <button 
         onClick={() => router.back()} 
         className="mb-4 text-gray-500 hover:text-green-600 flex items-center gap-1 text-sm font-medium"
      >
         <ArrowLeft size={16} /> Quay lại
      </button>

      <PageHeader 
        title="Chỉnh Sửa Sản Phẩm" 
        subtitle={`ID: ${product.id} - Cập nhật lần cuối: Hôm nay`}
      />

      <ProductForm initialData={product} onSubmit={handleUpdate} />
    </div>
  );
}