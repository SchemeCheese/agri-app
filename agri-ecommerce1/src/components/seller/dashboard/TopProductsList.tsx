import React from 'react';
import Image from 'next/image';

interface ProductRankItem {
  id: string;
  name: string;
  image?: string;
  stock?: number;
  sold?: number;
  revenue?: number;
  avgRating?: number;
}

interface TopProductsListProps {
  title: string;
  icon: React.ReactNode;
  items: ProductRankItem[];
  isLow?: boolean;
  loading?: boolean;
}

export const TopProductsList = ({ title, icon, items, isLow, loading }: TopProductsListProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
      {icon} {title}
    </h3>

    {loading ? (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
            <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    ) : items.length === 0 ? (
      <p className="text-sm text-gray-400 py-4 text-center">Chưa có dữ liệu.</p>
    ) : (
      <div className="space-y-3">
        {items.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-50">
            <span className={`font-bold w-6 text-center flex-shrink-0 ${idx === 0 ? 'text-yellow-500 text-lg' : 'text-gray-400 text-sm'}`}>
              {idx + 1}
            </span>
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{p.name}</h4>
              {p.stock !== undefined && <p className="text-xs text-gray-500">Kho: {p.stock}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              {p.avgRating !== undefined && (
                <p className="font-bold text-sm text-yellow-500">★ {Number(p.avgRating).toFixed(1)}</p>
              )}
              {p.revenue !== undefined && (
                <p className={`font-bold text-sm ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                  {p.revenue.toLocaleString()}đ
                </p>
              )}
              {p.sold !== undefined && (
                <p className="text-xs text-gray-400">{p.sold} đã bán</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
