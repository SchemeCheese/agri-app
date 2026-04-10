"use client"; 

import Image from 'next/image';
import Link from 'next/link'; 
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

type ProductCategory = 'trai-cay' | 'rau-cu' | 'ngu-coc' | 'gia-vi' | 'khac';

interface ProductCardProps {
  id: string;       
  imageUrl: string;
  title: string;
  description: string;
  price: string;    
  rawPrice: number;
  slug?: string;
  category?: ProductCategory;
  sellerId?: string;
  shop?: {
    id: string;
    store_name: string;
    avatar_url: string | null;
  };
  stock?: number;
  unit?: string;
  createdAt?: Date;
}

export const ProductCard = ({ 
  id, 
  imageUrl, 
  title, 
  description, 
  price, 
  rawPrice, 
  slug = '', 
  category = 'khac', 
  sellerId = '', 
  shop,
  stock = 0, 
  unit = '', 
  createdAt = new Date() 
}: ProductCardProps) => {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    // Ưu tiên dùng shop object đầy đủ (ắt từ BE), fallback sang sellerId
    const shopObj = shop ?? (sellerId ? { id: sellerId, store_name: '', avatar_url: null } : undefined);
    addToCart({
      id: id,
      name: title,
      price: rawPrice,
      images: [imageUrl],
      slug: slug,
      seller_id: shopObj?.id || sellerId,
      unit: unit || 'kg',
      shop: shopObj,
    }, 1);
    alert(`Đã thêm ${title} vào giỏ!`);
  };

  const productDetailUrl = `/products/${slug}`;

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col h-full group">
      <Link href={productDetailUrl} className="relative w-full h-48 block overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <Link href={productDetailUrl}>
          <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-1 hover:text-green-600 transition-colors cursor-pointer">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-3 h-10 line-clamp-2">{description}</p>
        
        <div className="mt-auto flex justify-between items-center">
          <p className="font-bold text-green-600 text-lg">{price}</p>
          
          <button 
            onClick={handleAddToCart}
            className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all transform active:scale-95 shadow-sm"
            title="Thêm vào giỏ hàng"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};