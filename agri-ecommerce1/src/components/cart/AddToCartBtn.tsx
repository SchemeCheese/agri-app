"use client"; 

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/data/mockData';

interface Props {
  product: Product;
}

export default function AddToCartBtn({ product }: Props) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleAdd = () => {
    addToCart(product, 1);
    alert(`Đã thêm ${product.name} vào giỏ!`); 
  };

  return (
    <button
      onClick={handleAdd}
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
    >
      Thêm vào giỏ
    </button>
  );
}