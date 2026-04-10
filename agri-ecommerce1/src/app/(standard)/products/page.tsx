"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import api from '@/lib/axios';
import { ProductCard } from '@/components/home/ProductCard';
import { formatCurrency } from '@/utils/vi';
import { Slider } from "@/components/ui/slider";
import { resolveImageUrl } from '@/lib/runtime-config';

const fixImageUrl = (url: string) => resolveImageUrl(url);

// Sửa lại danh mục khớp với tên trả về từ DB
const CATEGORIES = [
  { id: 'all', name: 'Tất cả' },
  { id: 'Trái cây', name: 'Trái cây' },
  { id: 'Rau củ', name: 'Rau củ' },
  { id: 'Ngũ cốc', name: 'Ngũ cốc' },
  { id: 'Gia vị', name: 'Gia vị' },
  { id: 'Khác', name: 'Khác' },
];

const ORIGINS = [
  { id: 'Đà Lạt', name: 'Đà Lạt' },
  { id: 'Tây Bắc', name: 'Tây Bắc' },
  { id: 'Miền Tây', name: 'Miền Tây' },
  { id: 'Nhập khẩu', name: 'Nhập khẩu' },
];

const MAX_PRICE = 2000000;

export default function ProductListingPage() {
  const [products, setProducts] = useState<any[]>([]); // Dữ liệu thật
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);

  // Lưu ý: Tính năng "Mùa vụ" (seasons) chưa có trong DB, tạm thời tôi sẽ bỏ phần lọc này hoặc bạn tự thêm vào sau

  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [sortOption, setSortOption] = useState('default');

  // Lấy dữ liệu từ BE
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleFilter = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedOrigins([]);
    setPriceRange([0, MAX_PRICE]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (selectedOrigins.length > 0 && !selectedOrigins.includes(product.origin)) return false;
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      return true;
    }).sort((a, b) => {
      if (sortOption === 'price_asc') return a.price - b.price;
      if (sortOption === 'price_desc') return b.price - a.price;
      return 0; // default (Mới nhất)
    });
  }, [products, selectedCategory, selectedOrigins, priceRange, sortOption]);

  if (loading) return <div className="text-center py-20">Đang tải dữ liệu...</div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">

      {/* --- BANNER ĐẦU TRANG SẢN PHẨM --- */}
      <div className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop"
          alt="Products Banner"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div> {/* Lớp phủ tối để nổi bật Header và Chữ */}
        <div className="relative z-10 text-center text-white mt-16 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sản Phẩm Của Chúng Tôi</h1>
          <p className="text-lg opacity-90">Từ nông trại đến bàn ăn gia đình - Tươi ngon mỗi ngày</p>
        </div>
      </div>
      {/* --------------------------------- */}

      {/* Nội dung trang cũ bắt đầu từ đây (Bỏ padding top pt-10 để nối liền với banner) */}
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/4 space-y-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex justify-between items-center">
                Danh mục
                {selectedCategory !== 'all' && (
                  <span onClick={() => setSelectedCategory('all')} className="text-xs text-green-600 cursor-pointer hover:underline font-normal">Xóa</span>
                )}
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === cat.id
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Bộ lọc</h3>
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Xóa tất cả</button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">Khoảng giá</label>
                  <span className="text-xs font-bold text-green-600">
                    {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                  </span>
                </div>
                <Slider
                  defaultValue={[0, MAX_PRICE]}
                  max={MAX_PRICE}
                  step={10000}
                  minStepsBetweenThumbs={1}
                  value={priceRange}
                  onValueChange={(val) => setPriceRange(val)}
                  className="my-4"
                />
              </div>

              <hr className="border-gray-100" />

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Nguồn gốc</h4>
                <div className="space-y-2">
                  {ORIGINS.map((origin) => (
                    <label key={origin.id} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedOrigins.includes(origin.id)}
                        onChange={() => toggleFilter(origin.id, selectedOrigins, setSelectedOrigins)}
                        className="rounded text-green-600 focus:ring-green-500 border-gray-300 w-4 h-4"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-green-700">{origin.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-gray-600 font-medium mb-4 sm:mb-0">
                Tìm thấy <span className="text-green-600 font-bold">{filteredProducts.length}</span> sản phẩm
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Sắp xếp:</span>
                <select
                  className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-green-500 focus:border-green-500 outline-none bg-white"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="default">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.id}
                    imageUrl={fixImageUrl(product.images?.[0] ?? '')}
                    title={product.name}
                    description={product.description}
                    price={formatCurrency(product.price)}
                    rawPrice={product.price}
                    sellerId={product.seller_id}
                    unit={product.unit}
                    shop={product.shop ? {
                      id: product.shop.id,
                      store_name: product.shop.store_name || product.shop.name || '',
                      avatar_url: product.shop.avatar_url || null,
                    } : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                <div className="text-4xl mb-4">🍂</div>
                <h3 className="text-lg font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500 mt-1">Vui lòng thử điều chỉnh bộ lọc.</p>
                <button onClick={clearFilters} className="mt-4 text-green-600 hover:text-green-700 font-medium hover:underline">
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}