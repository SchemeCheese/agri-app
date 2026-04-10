'use client';
import { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

interface ProductInfoProps {
  product: {
    name: string;
    price: string;
    description: string;
    sku: string;
    category: string;
  };
}

export const ProductInfo = ({ product }: ProductInfoProps) => {
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    addToCart({
      id: product.sku,
      name: product.name,
      price: parseFloat(product.price.replace(/\D/g, '')),
      images: [],
      slug: '',
      description: '',
      category: (product.category as 'gia-vi' | 'trai-cay' | 'rau-cu' | 'ngu-coc' | 'khac') || 'khac',
      origin: 'khac',
      seasons: []
    }, quantity);
    alert("Đã thêm vào giỏ!");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
      <p className="text-2xl font-semibold text-green-600">{product.price}</p>
      <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

      <div className="flex items-center space-x-4 pt-4">
        <div className="flex items-center border border-gray-300 rounded-full">
          <button onClick={decreaseQuantity} className="p-3 text-gray-600 hover:text-green-600">
            <Minus size={16} />
          </button>
          <span className="px-4 font-semibold">{quantity}</span>
          <button onClick={increaseQuantity} className="p-3 text-gray-600 hover:text-green-600">
            <Plus size={16} />
          </button>
        </div>

        <button onClick={handleAddToCart} className="flex-1 bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
          <ShoppingCart size={20} />
          <span>Thêm vào giỏ</span>
        </button>
      </div>

      <div className="pt-4 text-sm text-gray-500">
        <p>SKU: <span className="text-gray-700">{product.sku}</span></p>
        <p>Danh mục: <span className="text-gray-700">{product.category}</span></p>
      </div>
    </div>
  );
};