'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSellerShop } from '@/hooks/useSellerShop';
import { Camera, Save, MapPin, Store, ImageIcon, Globe, Loader2, Phone } from 'lucide-react';

export default function ShopProfilePage() {
  const { shop, loading, updateShop } = useSellerShop();
  const [form, setForm] = useState({ store_name: '', store_description: '', store_address: '', store_phone: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (shop) {
      setForm({
        store_name: shop.store_name || '',
        store_description: shop.store_description || '',
        store_address: shop.store_address || '',
        store_phone: shop.store_phone || '',
      });
      setAvatarPreview(shop.avatar_url || '');
      setBannerPreview(shop.banner_url || '');
    }
  }, [shop]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setIsSaving(true); setSaveError('');
    try {
      await updateShop(form, avatarFile ?? undefined, bannerFile ?? undefined);
    } catch (e: any) {
      setSaveError(e.message || 'Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="animate-spin text-green-500" size={36} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hồ sơ Shop</h1>
          <p className="text-gray-500 mt-2 font-medium">Thiết lập thông tin hiển thị và trang trí gian hàng của bạn.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI */}
        <div className="xl:col-span-1 space-y-8">

          {/* Box 1: Avatar & Tên Shop */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-green-50 to-emerald-100 z-0"></div>

            {/* Avatar */}
            <div className="relative z-10 mb-6 group">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white relative">
                {avatarPreview
                  ? <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
                  : <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-4xl font-bold">{form.store_name?.charAt(0) || 'S'}</div>
                }
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[1px]">
                  <Camera className="text-white mb-1" size={24} />
                  <span className="text-[10px] text-white font-bold uppercase">Đổi ảnh</span>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarUpload} accept="image/*" />
              </div>
              <div className="absolute bottom-1 right-1 bg-green-500 border-2 border-white rounded-full p-1.5 text-white shadow-sm">
                <Store size={14} />
              </div>
            </div>

            {/* Inputs */}
            <div className="w-full space-y-5 z-10 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Tên gian hàng</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={e => setForm({ ...form, store_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold text-gray-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Địa chỉ kho hàng</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={form.store_address}
                    onChange={e => setForm({ ...form, store_address: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={form.store_phone}
                    onChange={e => setForm({ ...form, store_phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Giới thiệu */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Globe size={20} className="text-blue-500" /> Giới thiệu Shop
            </h3>
            <textarea
              rows={5}
              value={form.store_description}
              onChange={e => setForm({ ...form, store_description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-gray-600 leading-relaxed transition-all"
              placeholder="VD: Chuyên cung cấp nông sản sạch Đà Lạt, cam kết VietGAP..."
            />
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="xl:col-span-2 space-y-8">

          {/* Box 3: Banner */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon size={20} className="text-purple-500" />
              Banner Gian Hàng
            </h3>

            {bannerPreview ? (
              <div className="relative aspect-[3/1] rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                <Image src={bannerPreview} alt="banner" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <label className="bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                    <Camera size={16} /> Đổi banner
                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="block aspect-[3/1] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all group">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition">
                  <ImageIcon className="text-gray-400 group-hover:text-green-600" size={22} />
                </div>
                <span className="text-sm font-bold text-gray-500 group-hover:text-green-700">Tải lên banner gian hàng</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG tỷ lệ 3:1</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

