"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency } from '@/utils/vi';
import {
  ShoppingCart, Plus, Minus, Star, Ticket, Truck,
  MapPin, MessageCircle, Store, ChevronRight, ThumbsUp, Handshake, Loader2
} from 'lucide-react';
import { ChatWidget } from '@/components/home/ChatWidget';
import { NegotiationDialog } from '@/components/chat/NegotiationDialog';
import { ChatPopoverWindow } from '@/components/chat/ChatPopoverWindow';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/runtime-config';

const fixImg = (url: string) => resolveImageUrl(url);

// --- SUB-COMPONENT: Rating Stars ---
const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={14}
        className={`${star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

// --- SUB-COMPONENT: Shop Info Card ---
const ShopInfoCard = ({ shop, product }: { shop: any; product: any }) => {
  const router = useRouter();
  const [chatShopLoading, setChatShopLoading] = useState(false);

  const handleChatShop = async () => {
    setChatShopLoading(true);
    try {
      const res = await api.post('/chat/initiate', { partnerId: shop.id });
      router.push(`/chat?conversationId=${res.data.conversationId}`);
    } catch (err) {
      console.error('Chat initiate error:', err);
    } finally {
      setChatShopLoading(false);
    }
  };

  return (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center gap-4">
    {/* Avatar & Tên */}
    <div className="flex items-center gap-4 border-r border-gray-100 pr-6 min-w-[300px]">
      <div className="relative w-16 h-16 rounded-full overflow-hidden border">
        <Image src={fixImg(shop.avatar_url || '')} alt={shop.store_name} fill sizes="64px" className="object-cover" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900">{shop.store_name}</h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <MapPin size={12} /> {shop.location ?? 'Chưa cập nhật'}
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {/* Chat với shop — chat tự do, không kèm sản phẩm */}
          <button
            onClick={handleChatShop}
            disabled={chatShopLoading}
            className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-medium hover:bg-green-100 transition disabled:opacity-60"
          >
            {chatShopLoading ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
            Chat với shop
          </button>
          <Link href={`/shop/${shop.id}`} className="flex items-center gap-1 text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
            <Store size={12} /> Xem Shop
          </Link>
        </div>
      </div>
    </div>

    {/* Chỉ số Shop */}
    <div className="grid grid-cols-3 gap-8 text-center flex-1">
      <div>
        <p className="text-gray-500 text-xs">Đánh giá</p>
        <p className="text-green-600 font-bold">{shop.rating || '5.0'} / 5.0</p>
      </div>
      <div>
        <p className="text-gray-500 text-xs">Phản hồi</p>
        <p className="text-gray-900 font-bold">{shop.responseRate || '100%'}</p>
      </div>
      <div>
        <p className="text-gray-500 text-xs">Tham gia</p>
        <p className="text-gray-900 font-bold">{shop.joinDate || '1 năm trước'}</p>
      </div>
    </div>
  </div>
  );
};

// --- MAIN COMPONENT ---
// Đã thêm allProducts vào props
export default function ProductClient({ product, allProducts }: { product: any, allProducts: any[] }) {
  const [quantity, setQuantity] = useState(1);
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const addToCart = useCartStore((state) => state.addToCart);
  const router = useRouter();

  const isUnavailable = !product.is_active || (product.stock ?? 0) <= 0;

  const handleBuyNow = () => {
    const shopName = product.shop?.store_name || product.shop?.name || '';
    router.push(
      `/checkout?bn=1&id=${encodeURIComponent(product.id)}&qty=${quantity}&price=${encodeURIComponent(product.price)}&sellerId=${encodeURIComponent(product.seller_id || product.shop?.id || '')}&shopName=${encodeURIComponent(shopName)}&name=${encodeURIComponent(product.name)}&img=${encodeURIComponent(fixImg(product.images?.[0] || ''))}&unit=${encodeURIComponent(product.unit || '')}`
    );
  };

  // Lọc sản phẩm cùng Shop từ biến allProducts
  const shopProducts = allProducts.filter(p => p.shop?.id === product.shop?.id && p.id !== product.id).slice(0, 6);

  // Lọc sản phẩm gợi ý từ biến allProducts
  const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 6);

  // Tìm đến hàm này và cập nhật object truyền vào addToCart
  const handleAddToCart = () => {
    // Truyền 2 tham số riêng biệt theo đúng yêu cầu của Store
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        images: product.images?.map(fixImg) ?? [],
        slug: product.id,
        seller_id: product.seller_id,
        unit: product.unit || 'kg',
        shop: product.shop ? {
          id: product.shop.id,
          store_name: product.shop.store_name || product.shop.name || '',
          avatar_url: product.shop.avatar_url || product.shop.avatar || null,
        } : (product.seller_id ? { id: product.seller_id, store_name: '', avatar_url: null } : undefined),
      },
      quantity
    );

    alert(`Đã thêm ${quantity} ${product.unit} ${product.name} vào giỏ hàng!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-8 bg-gray-50 min-h-screen">

      {/* 1. KHỐI THÔNG TIN CHÍNH (ẢNH + GIÁ + MUA) */}
      <div className="bg-white p-6 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Cột Trái: Ảnh */}
        <div className="md:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
            <Image
              src={fixImg(product.images[activeImage])}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img: string, idx: number) => (
              <div
                key={idx}
                onMouseEnter={() => setActiveImage(idx)}
                className={`relative w-20 h-20 border-2 rounded cursor-pointer shrink-0 ${activeImage === idx ? 'border-green-600' : 'border-transparent'}`}
              >
                <Image src={fixImg(img)} alt="thumb" fill sizes="80px" className="object-cover rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Cột Phải: Info */}
        <div className="md:col-span-7">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">{product.name}</h1>

          <div className="flex items-center gap-4 text-sm mb-4 border-b pb-4 border-gray-100">
            <div className="flex items-center gap-1 text-yellow-500 border-r pr-4 border-gray-300">
              <span className="font-bold underline">{product.rating}</span>
              <RatingStars rating={product.rating} />
            </div>
            <div className="border-r pr-4 border-gray-300">
              <span className="font-bold border-b border-gray-800 border-dotted">{product.reviewCount}</span>
              <span className="text-gray-500 ml-1">Đánh giá</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">{product.sold}</span>
              <span className="text-gray-500 ml-1">Đã bán</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-end gap-3">
              {product.originalPrice && (
                <span className="text-gray-400 line-through text-lg">{formatCurrency(product.originalPrice)}</span>
              )}
              <span className="text-3xl font-bold text-green-600">{formatCurrency(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xs font-bold bg-red-100 text-red-600 px-1 py-0.5 rounded">
                  GIẢM {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Vouchers */}
          {product.vouchers && product.vouchers.length > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-500 w-24 text-sm">Mã giảm giá</span>
              <div className="flex gap-2">
                {product.vouchers.map((v: string) => (
                  <span key={v} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Ticket size={12} /> {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vận chuyển */}
          <div className="flex items-start gap-4 mb-8">
            <span className="text-gray-500 w-24 text-sm mt-1">Vận chuyển</span>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                <Truck size={18} className="text-green-600" />
                <span>Vận chuyển tới <span className="font-bold">Hà Nội</span></span>
              </div>
              <p className="text-xs text-gray-500 pl-7">Phí vận chuyển: ₫15.000 - ₫30.000 (Dự kiến giao 2-3 ngày)</p>
            </div>
          </div>

          {/* Số lượng & Button */}
          <div className="flex items-center gap-6 mb-8">
            <span className="text-gray-500 w-24 text-sm">Số lượng</span>
            <div className="flex items-center border border-gray-300 rounded">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-100"><Minus size={14} /></button>
              <input type="text" value={quantity} readOnly className="w-12 text-center text-sm font-medium focus:outline-none" />
              <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-gray-100"><Plus size={14} /></button>
            </div>
            <span className="text-xs text-gray-500">{product.stock} sản phẩm có sẵn</span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={isUnavailable}
              className="flex-1 bg-green-50 border border-green-600 text-green-700 py-3 rounded-md font-bold hover:bg-green-100 transition flex justify-center items-center gap-2"
            >
              <ShoppingCart size={20} /> Thêm vào giỏ hàng
            </button>
            <button onClick={handleBuyNow} disabled={isUnavailable} className="flex-1 bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
              Mua ngay
            </button>
          </div>

          {isUnavailable && (
            <div className="mt-3 text-sm font-semibold text-red-600 flex items-center gap-2">
              <Loader2 size={16} className="animate-pulse" /> Sản phẩm tạm hết hàng / ngừng bán
            </div>
          )}

          {/* Nút thương lượng + Chat ngay */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setShowNegotiationDialog(true)}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-500 text-orange-600 py-3 rounded-md font-bold hover:bg-orange-50 transition"
            >
              <Handshake size={18} /> Thương lượng giá
            </button>
            <button
              onClick={() => setShowChatPanel(true)}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-green-500 text-green-700 py-3 rounded-md font-bold hover:bg-green-50 transition"
            >
              <MessageCircle size={18} /> Chat ngay
            </button>
          </div>
        </div>
      </div>

      {/* 2. THÔNG TIN SHOP */}
      <ShopInfoCard shop={product.shop} product={product} />

      {/* 3. CHI TIẾT SẢN PHẨM */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold bg-gray-50 p-3 rounded mb-4 text-gray-800 uppercase">Chi tiết sản phẩm</h2>
        <div className="space-y-3 text-sm text-gray-700 px-2">
          <div className="grid grid-cols-[150px_1fr]">
            <span className="text-gray-500">Danh mục</span>
            <span className="text-green-600 font-medium">Agri Connect {'>'} {product.category}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr]">
            <span className="text-gray-500">Thương hiệu</span>
            <span>{product.brand}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr]">
            <span className="text-gray-500">Nguồn gốc</span>
            <span className="capitalize">{product.origin}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr]">
            <span className="text-gray-500">Kho hàng</span>
            <span>{product.stock}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr]">
            <span className="text-gray-500">Gửi từ</span>
            <span>{product.shop.location}</span>
          </div>
          <div className="grid grid-cols-[150px_1fr]">
            <span className="text-gray-500">Mùa vụ</span>
            <span className="capitalize">{product.seasons ? product.seasons.join(', ') : 'Quanh năm'}</span>
          </div>
        </div>

        <h2 className="text-lg font-bold bg-gray-50 p-3 rounded my-4 text-gray-800 uppercase">Mô tả sản phẩm</h2>
        <div className="text-gray-700 leading-relaxed px-2 whitespace-pre-line">
          {product.description}
        </div>
      </div>

      {/* 4. ĐÁNH GIÁ SẢN PHẨM */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-6 uppercase">Đánh giá sản phẩm</h2>

        {(!product.reviews || product.reviews.length === 0) ? (
          <p className="text-gray-500 text-center py-4">Chưa có đánh giá nào.</p>
        ) : (
          <div className="space-y-6">
            {product.reviews.map((review: any) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                    {review.userName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{review.userName}</div>
                    <RatingStars rating={review.rating} />
                    <div className="text-xs text-gray-400 mt-1">{new Date(review.date).toLocaleDateString('vi-VN')} | Phân loại mặc định</div>
                    <div className="mt-3 text-gray-700 text-sm">{review.comment}</div>

                    {/* Ảnh review nếu có */}
                    {review.images && review.images.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {review.images.map((img: string, index: number) => (
                          <div key={index} className="relative w-20 h-20">
                            <Image src={img} alt={`Review image ${index + 1}`} fill className="object-cover rounded border" />
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="flex items-center gap-1 text-gray-400 text-xs mt-3 hover:text-green-600">
                      <ThumbsUp size={12} /> Hữu ích?
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. CÁC SẢN PHẨM KHÁC CỦA SHOP */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 uppercase border-l-4 border-green-600 pl-3">
            Sản phẩm khác của Shop
          </h2>
          <Link href={`/shop/${product.seller_id || product.shop?.id}`} className="text-green-600 text-sm hover:underline flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {shopProducts.map((p: any) => (
            <div key={p.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 group">
              <Link href={`/products/${p.id}`}>
                <div className="relative aspect-square w-full">
                  <Image src={fixImg(p.images?.[0] ?? '')} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[40px] mb-2 group-hover:text-green-600 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-bold">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-gray-400">Đã bán {p.sold || 0}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          {shopProducts.length === 0 && <p className="col-span-full text-center text-gray-400 py-4">Shop chưa có sản phẩm nào khác.</p>}
        </div>
      </div>

      {/* 6. CÓ THỂ BẠN CŨNG THÍCH */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 uppercase border-l-4 border-green-600 pl-3">Có thể bạn cũng thích</h2>
          <Link href="/products" className="text-green-600 text-sm hover:underline">Xem thêm</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {relatedProducts.map((p: any) => (
            <div key={p.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 group">
              <Link href={`/products/${p.id}`}>
                <div className="relative aspect-square w-full">
                  <Image src={fixImg(p.images?.[0] ?? '')} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[40px] mb-2 group-hover:text-green-600 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-bold">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-gray-400">Đã bán {p.sold || 0}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <ChatWidget />

      {/* Chat ngay panel */}
      {showChatPanel && product.shop && (
        <ChatPopoverWindow
          product={{
            id:    product.id,
            name:  product.name,
            price: Number(product.price),
            unit:  product.unit || 'kg',
            image: product.images?.[0] || '',
          }}
          shop={{
            id:         product.shop.id,
            store_name: product.shop.store_name || product.shop.name || '',
            avatar_url: product.shop.avatar_url || product.shop.avatar || '',
          }}
          onClose={() => setShowChatPanel(false)}
        />
      )}

      {/* Dialog thương lượng giá */}
      {showNegotiationDialog && (
        <NegotiationDialog
          product={{
            id:                  product.id,
            name:                product.name,
            unit:                product.unit || 'kg',
            min_negotiation_qty: product.min_negotiation_qty || 1,
            currentPrice:        Number(product.price) || undefined,
          }}
          onConfirm={(qty, proposedPrice) => {
            setShowNegotiationDialog(false);
            const sellerId = product.seller_id || product.shop?.id || '';
            router.push(
              `/chat?sellerId=${sellerId}&negotiate=1` +
              `&productId=${product.id}` +
              `&qty=${qty}` +
              `&proposedPrice=${proposedPrice}` +
              `&productName=${encodeURIComponent(product.name)}` +
              `&productPrice=${encodeURIComponent(product.price)}` +
              `&productImg=${encodeURIComponent(product.images?.[0] || '')}` +
              `&productUnit=${encodeURIComponent(product.unit || 'kg')}`
            );
          }}
          onClose={() => setShowNegotiationDialog(false)}
        />
      )}
    </div>
  );
}