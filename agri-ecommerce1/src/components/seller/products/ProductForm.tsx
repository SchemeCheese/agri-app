"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, X, Save, Loader2, ChevronRight, Handshake } from 'lucide-react';
import { SellerProduct, ProductFormData } from '@/hooks/useSellerProducts';

interface ProductFormProps {
  initialData?: SellerProduct;
  onSubmit: (data: ProductFormData, imageFiles: File[]) => Promise<void>;
}

const CATEGORIES = [
  { value: 'trai-cay',   label: 'Trái cây'   },
  { value: 'rau-cu',     label: 'Rau củ'     },
  { value: 'hat-ngu-coc', label: 'Hạt ngũ cốc' },
  { value: 'do-kho',     label: 'Đồ khô'     },
  { value: 'nuoc-ep',    label: 'Nước ép'    },
  { value: 'khac',       label: 'Khác'       },
];

export const ProductForm = ({ initialData, onSubmit }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name:                initialData?.name                ?? '',
    price:               initialData?.price               ?? 0,
    stock:               initialData?.stock               ?? 100,
    description:         initialData?.description         ?? '',
    unit:                initialData?.unit                ?? 'kg',
    category:            initialData?.category            ?? 'trai-cay',
    origin:              initialData?.origin              ?? '',
    min_negotiation_qty: initialData?.min_negotiation_qty ?? null,
  });

  // Negotiation toggle
  const [allowNegotiation, setAllowNegotiation] = useState(
    (initialData?.min_negotiation_qty ?? 0) > 0
  );

  // Ảnh hiện có (URL từ server)
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images ?? []);
  // Ảnh mới (File objects)
  const [newImageFiles, setNewImageFiles]   = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  // Liên kết ảnh nhập tay
  const [imageLinksText, setImageLinksText] = useState('');
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(newImagePreviews[idx]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleNegotiationToggle = (checked: boolean) => {
    setAllowNegotiation(checked);
    if (!checked) handleChange('min_negotiation_qty', null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setSaveError('Vui lòng nhập tên sản phẩm'); return; }
    if (formData.price <= 0)   { setSaveError('Giá bán phải lớn hơn 0');     return; }
    if (allowNegotiation && (!formData.min_negotiation_qty || formData.min_negotiation_qty <= 0)) {
      setSaveError('Vui lòng nhập ngưỡng số lượng tối thiểu cho thương lượng');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onSubmit({ ...formData, image_urls: imageLinks }, newImageFiles);
    } catch (err: any) {
      setSaveError(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const totalImages = existingImages.length + newImagePreviews.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* ── CỘT TRÁI: Thông tin chính ── */}
      <div className="lg:col-span-2 space-y-6">

        {/* Box 1: Thông tin cơ bản */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <div className="w-1 h-6 bg-green-500 rounded-full" />
            Thông tin cơ bản
          </h3>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tên sản phẩm <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium text-lg"
              placeholder="VD: Dâu tây Đà Lạt loại 1..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết</label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
              placeholder="Mô tả về hương vị, xuất xứ, cách bảo quản..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Xuất xứ</label>
              <input
                type="text"
                value={formData.origin}
                onChange={e => handleChange('origin', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                placeholder="VD: Đà Lạt"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Đơn vị</label>
              <input
                type="text"
                value={formData.unit}
                onChange={e => handleChange('unit', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                placeholder="kg, g, thùng, hộp..."
              />
            </div>
          </div>
        </div>

        {/* Box 2: Giá & Kho */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            Giá bán &amp; Kho hàng
          </h3>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Giá bán (đ) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={formData.price}
                onChange={e => handleChange('price', Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-xl font-bold text-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tồn kho <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={formData.stock}
                onChange={e => handleChange('stock', Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: Ảnh & Phân loại ── */}
      <div className="space-y-6">

        {/* Box 3: Ảnh */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            Hình ảnh
            <span className="text-xs font-normal text-gray-400 ml-2">({totalImages} ảnh)</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Ảnh cũ từ server */}
            {existingImages.map((img, idx) => (
              <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                <Image src={img} alt="product" fill className="object-cover" />
                <button
                  onClick={() => removeExistingImage(idx)}
                  className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Ảnh mới đang chọn */}
            {newImagePreviews.map((src, idx) => (
              <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-200 group">
                <Image src={src} alt="new" fill className="object-cover" />
                <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Mới</div>
                <button
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Upload button */}
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 text-gray-400 hover:text-green-600 transition-all">
              <Upload size={22} />
              <span className="text-xs font-bold mt-2">Tải ảnh lên</span>
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" multiple />
            </label>
          </div>

          {/* Nhập link ảnh thủ công */}
          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Dán link ảnh (mỗi dòng một link hoặc cách nhau dấu phẩy)</label>
            <textarea
              value={imageLinksText}
              onChange={(e) => {
                const raw = e.target.value;
                setImageLinksText(raw);
                const parsed = raw
                  .split(/\s|,|\n/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                setImageLinks(parsed);
              }}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
              placeholder="https://example.com/a.jpg"
            />
            {imageLinks.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {imageLinks.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-green-200">
                    <Image src={url} alt="link" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Box 4: Phân loại */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Phân loại</h3>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục</label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={e => handleChange('category', e.target.value)}
                className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-green-500 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-3.5 text-gray-400 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Box 5: Thương lượng giá */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Handshake size={18} className="text-green-600" />
            Thương lượng giá
          </h3>

          <label className="flex items-center gap-3 cursor-pointer select-none mb-3">
            <div
              onClick={() => handleNegotiationToggle(!allowNegotiation)}
              className={`w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                allowNegotiation ? 'bg-green-500' : 'bg-gray-200'
              } relative`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  allowNegotiation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm font-semibold text-gray-800">
              Cho phép người mua thương lượng giá
            </span>
          </label>

          {allowNegotiation && (
            <div className="mt-3">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Số lượng tối thiểu để thương lượng{' '}
                <span className="text-red-400">*</span>
                <span className="font-normal text-gray-400 ml-1">({formData.unit || 'đơn vị'})</span>
              </label>
              <input
                type="number"
                min={1}
                value={formData.min_negotiation_qty ?? ''}
                onChange={e =>
                  handleChange(
                    'min_negotiation_qty',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold"
                placeholder={`VD: 50 ${formData.unit || 'kg'}`}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Người mua chỉ được gửi yêu cầu thương lượng khi mua từ mức này trở lên.
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {saveError && (
          <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-100">
            {saveError}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-600/30 hover:bg-green-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
        </button>
      </div>
    </div>
  );
};

