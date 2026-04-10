'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSellerProducts } from '@/hooks/useSellerProducts';
import { Search, Plus, SlidersHorizontal, ArrowUpDown, Package, Loader2 } from 'lucide-react';
import { SellerProductCard } from '@/components/seller/products/SellerProductCard';

export default function ProductManagementPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { products, loading, error, fetchProducts, deleteProduct } = useSellerProducts();

  useEffect(() => { fetchProducts(); }, []); // eslint-disable-line

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    await deleteProduct(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sản phẩm</h1>
          <p className="text-gray-500 mt-2 font-medium">Quản lý kho hàng và danh mục sản phẩm của bạn.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/products/create')}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all active:scale-95"
        >
          <Plus size={20} /> Thêm sản phẩm mới
        </button>
      </div>

      {/* 2. Toolbar (Search & Filter) */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2 sticky top-24 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã SKU..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <SlidersHorizontal size={18} /> Bộ lọc
          </button>
          <button className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <ArrowUpDown size={18} /> Sắp xếp
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="animate-spin text-green-500" size={36} />
        </div>
      ) : error ? (
        <div className="text-center py-32 text-red-500 bg-white rounded-3xl border border-dashed border-red-200">
          <p className="font-bold">Không thể tải sản phẩm</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={fetchProducts} className="mt-4 text-sm text-green-600 font-bold hover:underline">Thử lại</button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <SellerProductCard
              key={product.id}
              product={product}
              onEdit={(id) => router.push(`/dashboard/products/${id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Không tìm thấy sản phẩm</h3>
          <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      )}
    </div>
  );
}