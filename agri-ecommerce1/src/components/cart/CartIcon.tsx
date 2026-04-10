"use client";

import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const items = useCartStore((state) => state.getItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  if (!mounted) return null; 

  return (
    <Link href="/cart" className="relative group">
    
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-gray-700 group-hover:text-green-600 transition"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
          {totalItems}
        </span>
      )}
    </Link>
  );
}