// src/components/home/TopSearches.tsx
import React from 'react';
import { TOP_KEYWORDS } from '@/data'; 
import { TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export const TopSearches = () => {
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <Container>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-red-500 w-5 h-5" />
          <h3 className="font-bold text-gray-800 text-lg uppercase">Tìm kiếm hàng đầu</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {TOP_KEYWORDS.map((keyword, index) => (
            <div 
              key={index}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 cursor-pointer transition-colors"
            >
              {keyword}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};