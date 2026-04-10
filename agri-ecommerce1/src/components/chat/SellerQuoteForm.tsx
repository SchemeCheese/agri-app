'use client';

import React, { useState } from 'react';
import { X, Send, ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/utils/vi';

export interface SellerProductOption {
  id:    string;
  name:  string;
  unit?: string;
}

interface QuoteSendData {
  productId:   string;
  productName: string;
  quantity:    number;
  price:       number;
  unit:        string;
}

interface Props {
  products:       SellerProductOption[];
  /** Nếu có, khoá dropdown sản phẩm theo negotiation context */
  defaultProduct?: { id: string; name: string; unit: string; quantity?: number };
  onSend:  (data: QuoteSendData) => void;
  onClose: () => void;
}

export const SellerQuoteForm = ({ products, defaultProduct, onSend, onClose }: Props) => {
  const initialId = defaultProduct?.id || products[0]?.id || '';
  const [selectedId, setSelectedId] = useState(initialId);
  const [quantity,   setQuantity]   = useState<string>(String(defaultProduct?.quantity || ''));
  const [price,      setPrice]      = useState<string>('');
  const [error,      setError]      = useState('');

  const selectedProduct = defaultProduct
    ? { id: defaultProduct.id, name: defaultProduct.name, unit: defaultProduct.unit }
    : products.find(p => p.id === selectedId);

  const total =
    Number(quantity) > 0 && Number(price) > 0
      ? Number(quantity) * Number(price)
      : 0;

  const handleSend = () => {
    const qty = Number(quantity);
    const prc = Number(price);
    if (!selectedId)           { setError('Vui lòng chọn sản phẩm');           return; }
    if (!qty || qty <= 0)      { setError('Vui lòng nhập số lượng hợp lệ');    return; }
    if (!prc || prc <= 0)      { setError('Vui lòng nhập giá đề xuất hợp lệ'); return; }
    setError('');
    onSend({
      productId:   selectedProduct?.id   || selectedId,
      productName: selectedProduct?.name || '',
      quantity:    qty,
      price:       prc,
      unit:        selectedProduct?.unit || 'kg',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Gửi báo giá</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Product */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Sản phẩm</label>
            {defaultProduct ? (
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800">
                {defaultProduct.name}
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none text-sm"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Số lượng ({selectedProduct?.unit || 'đơn vị'})
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => { setQuantity(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none font-bold"
                placeholder="VD: 50"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Giá (đ/{selectedProduct?.unit || '...'})
              </label>
              <input
                type="number"
                value={price}
                onChange={e => { setPrice(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none font-bold text-green-600"
                placeholder="VD: 18000"
                min={1}
              />
            </div>
          </div>

          {/* Preview total */}
          {total > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-sm flex justify-between">
              <span className="text-gray-600">Tổng dự kiến:</span>
              <span className="font-bold text-green-700">{formatCurrency(total)}</span>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Send size={16} /> Gửi báo giá
          </button>
        </div>
      </div>
    </div>
  );
};
