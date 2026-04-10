// src/components/products/FilterSidebar.tsx
'use client';
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export const FilterSidebar = () => {
  const { t } = useTranslation();

  const categories = [
    { id: 'fruits', name: 'Trái cây' },
    { id: 'vegetables', name: 'Rau củ' },
    { id: 'grains', name: 'Ngũ cốc' },
    { id: 'meat', name: 'Thịt tươi' },
  ];

  const origins = [
    { id: 'dalat', name: 'Đà Lạt' },
    { id: 'mekong', name: 'Đồng Bằng SCL' },
    { id: 'north', name: 'Miền Bắc' },
  ];

  return (
    <div className="space-y-6">
      {/* Lọc theo Danh mục */}
      <div>
        <h3 className="font-semibold text-lg mb-3">{t('category')}</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Lọc theo Nguồn gốc */}
      <div>
        <h3 className="font-semibold text-lg mb-3">{t('origin')}</h3>
        <div className="space-y-2">
          {origins.map((origin) => (
            <label key={origin.id} className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span>{origin.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Lọc theo Giá */}
      <div>
        <h3 className="font-semibold text-lg mb-3">{t('price_range')}</h3>
        <div className="space-y-2">
           <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="radio" name="price" className="text-green-600 focus:ring-green-500" />
              <span>Dưới 50.000đ</span>
            </label>
             <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="radio" name="price" className="text-green-600 focus:ring-green-500" />
              <span>50.000đ - 100.000đ</span>
            </label>
             <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="radio" name="price" className="text-green-600 focus:ring-green-500" />
              <span>Trên 100.000đ</span>
            </label>
        </div>
      </div>
    </div>
  );
};