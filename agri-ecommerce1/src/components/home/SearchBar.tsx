// src/components/home/SearchBar.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Filter, Store, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/runtime-config';

const fixImg = (url: string) => resolveImageUrl(url) || '';

interface SearchResult { shops: any[]; products: any[]; }

export const SearchBar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ shops: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ category: '', origin: '', season: '', minPrice: '', maxPrice: '' });

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults({ shops: [], products: [] });
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.get('/search', { params: { q: val } })
        .then(res => { setResults(res.data); setShowDropdown(true); })
        .catch(() => setResults({ shops: [], products: [] }))
        .finally(() => setLoading(false));
    }, 350);
  };

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [query, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
    if (query.trim()) {
      const params = new URLSearchParams({ q: query.trim(), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      router.push(`/search?${params.toString()}`);
    }
  };

  const hasResults = results.shops.length > 0 || results.products.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      {/* Search Input Row */}
      <div className="bg-white rounded-full shadow-lg p-2 flex items-center space-x-2 w-full">
        <div className="flex-grow flex items-center pl-3">
          {loading
            ? <Loader2 size={20} className="text-gray-400 mr-2 flex-shrink-0 animate-spin" />
            : <Search size={20} className="text-gray-400 mr-2 flex-shrink-0" />
          }
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => hasResults && setShowDropdown(true)}
            placeholder={t('product_placeholder')}
            className="w-full text-sm focus:outline-none placeholder-gray-500 bg-transparent"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults({ shops: [], products: [] }); setShowDropdown(false); }}
              className="text-gray-400 hover:text-gray-600 p-1">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
          >
            <Filter size={16} />
            <span>{t('filters')}</span>
          </button>

          {isFilterOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl p-4 z-30 border border-gray-200">
              <h4 className="text-sm font-semibold mb-3">{t('filters')}</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('category')}</label>
                  <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                    <option value="">{t('all_categories')}</option>
                    <option value="fruits">Trái cây</option>
                    <option value="vegetables">Rau củ</option>
                    <option value="grains">Ngũ cốc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('origin')}</label>
                  <select name="origin" value={filters.origin} onChange={handleFilterChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                    <option value="">{t('all_origins')}</option>
                    <option value="dalat">Đà Lạt</option>
                    <option value="mekong">Đồng Bằng SCL</option>
                    <option value="north">Miền Bắc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('season')}</label>
                  <select name="season" value={filters.season} onChange={handleFilterChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                    <option value="">{t('all_seasons')}</option>
                    <option value="spring">Xuân</option>
                    <option value="summer">Hạ</option>
                    <option value="autumn">Thu</option>
                    <option value="winter">Đông</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">{t('price_range')}</label>
                  <div className="flex space-x-2">
                    <input type="number" name="minPrice" placeholder={t('min_price')} value={filters.minPrice} onChange={handleFilterChange} className="w-1/2 p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                    <input type="number" name="maxPrice" placeholder={t('max_price')} value={filters.maxPrice} onChange={handleFilterChange} className="w-1/2 p-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                  </div>
                </div>
              </div>
              <button onClick={handleApplyFilters} className="mt-4 w-full bg-green-600 text-white py-1.5 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors">
                {t('apply_filters')}
              </button>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button onClick={handleSearch} className="bg-green-600 text-white rounded-full p-2.5 hover:bg-green-700 transition-colors focus:outline-none flex-shrink-0">
          <Search size={20} />
        </button>
      </div>

      {/* Dropdown Results */}
      {showDropdown && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-30 overflow-hidden max-h-[420px] overflow-y-auto">

          {/* Shops section — luôn hiển thị trước */}
          {results.shops.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">🏪 Shop</p>
              </div>
              {results.shops.slice(0, 3).map((shop: any) => (
                <Link key={shop.id} href={`/shop/${shop.id}`} onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {shop.avatar_url
                      ? <img src={fixImg(shop.avatar_url)} alt={shop.store_name} className="w-full h-full object-cover" />
                      : <Store size={18} className="text-green-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{shop.store_name}</p>
                    <p className="text-xs text-gray-400">{shop.product_count} sản phẩm · ⭐ {Number(shop.rating ?? 0).toFixed(1)}</p>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">Shop</span>
                </Link>
              ))}
            </div>
          )}

          {/* Products section */}
          {results.products.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">🥬 Sản Phẩm</p>
              </div>
              {results.products.slice(0, 5).map((p: any) => (
                <Link key={p.id} href={`/products/${p.id}`} onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                    {p.images?.[0] && <img src={fixImg(p.images[0])} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.seller?.store_name} · {Number(p.price ?? 0).toLocaleString()}đ/{p.unit}</p>
                  </div>
                </Link>
              ))}
              <button onClick={handleSearch}
                className="w-full px-4 py-3 text-sm text-green-600 font-semibold hover:bg-green-50 border-t border-gray-100 transition-colors text-center">
                Xem tất cả kết quả cho &quot;{query}&quot; →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};