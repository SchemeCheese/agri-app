import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';

export interface SellerShopProfile {
  id: string;
  store_name: string;
  store_description?: string;
  store_address?: string;
  store_phone?: string;
  avatar_url?: string;
  banner_url?: string;
  rating?: number;
  total_products?: number;
  total_orders?: number;
  created_at?: string;
}

export function useSellerShop() {
  const [shop, setShop]       = useState<SellerShopProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /profile/me — dùng chung endpoint profile
      const res = await api.get('/profile/me');
      const d = res.data;
      setShop({
        id:                d.id,
        store_name:        d.profile?.store_name        || d.full_name || '',
        store_description: d.profile?.description       || '',
        store_address:     d.profile?.address           || '',
        store_phone:       d.phone_number               || '',
        // Guard: if BE already returns a full URL, don't double-prefix
        avatar_url:        d.avatar
          ? (d.avatar.startsWith('http') ? d.avatar : `http://localhost:3001${d.avatar}`)
          : '',
        banner_url:        d.profile?.banner_url        || '',
        rating:            d.profile?.rating            || 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin shop');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch khi hook mount
  useEffect(() => { fetchShop(); }, [fetchShop]);

  const updateShop = async (data: Partial<SellerShopProfile>, avatarFile?: File, _bannerFile?: File) => {
    setSaving(true);
    try {
      // PATCH /profile/me nhận JSON
      await api.patch('/profile/me', {
        ...(data.store_name        && { store_name:  data.store_name }),
        ...(data.store_description && { description: data.store_description }),
        ...(data.store_address     && { address:     data.store_address }),
        ...(data.store_phone       && { phone_number: data.store_phone }),
      });

      // Upload avatar riêng nếu có
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const av = await api.post('/profile/me/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (av.data?.avatar) {
          setShop(prev => prev ? { ...prev, avatar_url: `http://localhost:3001${av.data.avatar}` } : prev);
        }
      }

      // Refresh toàn bộ
      await fetchShop();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Lỗi khi cập nhật shop');
    } finally {
      setSaving(false);
    }
  };

  return { shop, loading, saving, error, fetchShop, updateShop, setShop };
}
