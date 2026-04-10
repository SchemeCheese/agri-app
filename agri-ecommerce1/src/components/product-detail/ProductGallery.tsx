// src/components/product-detail/ProductGallery.tsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';

interface ImageProps {
  id: string;
  src: string;
}

interface ProductGalleryProps {
  images: ImageProps[];
}

export const ProductGallery = ({ images }: ProductGalleryProps) => {
  const [mainImage, setMainImage] = useState(images[0] || { src: '', id: '' });

  return (
    <div className="flex flex-col gap-4">
      {/* Ảnh chính */}
      <div className="relative w-full h-96 border rounded-lg overflow-hidden shadow-sm">
        <Image
          src={mainImage.src}
          alt="Ảnh sản phẩm chính"
          layout="fill"
          objectFit="cover"
        />
      </div>
      {/* Danh sách ảnh thumbnail */}
      <div className="flex space-x-2 overflow-x-auto">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setMainImage(image)}
            className={`relative w-20 h-20 flex-shrink-0 border rounded-md overflow-hidden transition-all
                        ${mainImage.id === image.id ? 'border-green-600 border-2' : 'border-gray-200'}
            `}
          >
            <Image
              src={image.src}
              alt="Ảnh thumbnail"
              layout="fill"
              objectFit="cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};