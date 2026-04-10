'use client';

import React, { useState } from 'react';
import { X, Handshake, AlertCircle, ChevronRight, ChevronLeft, Package, Tag } from 'lucide-react';
import { formatCurrency } from '@/utils/vi';

interface Props {
  product: {
    id:                  string;
    name:                string;
    unit:                string;
    min_negotiation_qty: number;
    currentPrice?:       number;
  };
  onConfirm: (quantity: number, proposedPrice: number) => void;
  onClose:   () => void;
}

export const NegotiationDialog = ({ product, onConfirm, onClose }: Props) => {
  const [step,          setStep]          = useState<1 | 2>(1);
  const [qty,           setQty]           = useState<string>(String(product.min_negotiation_qty || 1));
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [error,         setError]         = useState('');

  const qtyNum   = Number(qty);
  const priceNum = Number(proposedPrice);

  // ── Step 1: validate qty ─────────────────────────────
  const handleNext = () => {
    if (!qty || isNaN(qtyNum) || qtyNum <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ'); return;
    }
    if (qtyNum < (product.min_negotiation_qty || 1)) {
      setError(`Số lượng tối thiểu để thương lượng là ${product.min_negotiation_qty} ${product.unit}`); return;
    }
    setError('');
    setStep(2);
  };

  // ── Step 2: validate price & confirm ────────────────
  const handleConfirm = () => {
    if (!proposedPrice || isNaN(priceNum) || priceNum <= 0) {
      setError('Vui lòng nhập giá đề xuất hợp lệ'); return;
    }
    setError('');
    onConfirm(qtyNum, priceNum);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
              <Handshake size={18} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Thương lượng giá</h2>
              <p className="text-xs text-gray-400">Bước {step}/2</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`} />
        </div>

        {/* Product info */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex items-center gap-3">
          <Package size={18} className="text-orange-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
            {product.min_negotiation_qty > 0 && (
              <p className="text-xs text-orange-700 mt-0.5">
                Thương lượng từ <strong>{product.min_negotiation_qty} {product.unit}</strong> trở lên
              </p>
            )}
          </div>
          {product.currentPrice && (
            <div className="ml-auto text-right flex-shrink-0">
              <p className="text-[10px] text-gray-400">Giá niêm yết</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(product.currentPrice)}<span className="text-xs font-normal text-gray-400">/{product.unit}</span></p>
            </div>
          )}
        </div>

        {/* ── STEP 1: Quantity ── */}
        {step === 1 && (
          <>
            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Package size={14} className="text-gray-400" />
                Bạn muốn mua bao nhiêu {product.unit}?
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={qty}
                  onChange={e => { setQty(e.target.value); setError(''); }}
                  min={product.min_negotiation_qty || 1}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-xl font-bold text-gray-900"
                  placeholder={`VD: ${product.min_negotiation_qty || 10}`}
                  autoFocus
                />
                <span className="text-sm font-bold text-gray-500 w-10 text-center">{product.unit}</span>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">
                Hủy
              </button>
              <button onClick={handleNext} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-1.5">
                Tiếp theo <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Proposed Price ── */}
        {step === 2 && (
          <>
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Số lượng</span>
                <span className="font-bold">{qtyNum} {product.unit}</span>
              </div>
              {product.currentPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Giá tham khảo</span>
                  <span className="font-bold text-green-600">{formatCurrency(product.currentPrice)}/{product.unit}</span>
                </div>
              )}
              {proposedPrice && !isNaN(priceNum) && priceNum > 0 && (
                <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                  <span className="text-gray-500">Tổng đề xuất</span>
                  <span className="font-black text-orange-600">{formatCurrency(priceNum * qtyNum)}</span>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Tag size={14} className="text-gray-400" />
                Giá bạn muốn đề xuất (đ/{product.unit})
              </label>
              <input
                type="number"
                value={proposedPrice}
                onChange={e => { setProposedPrice(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-xl font-bold text-gray-900"
                placeholder={product.currentPrice ? `VD: ${Math.round(product.currentPrice * 0.9).toLocaleString('vi-VN')}` : 'Nhập giá...'}
                autoFocus
              />
              {product.currentPrice && priceNum > 0 && (
                <p className={`text-xs mt-1.5 font-medium ${priceNum < product.currentPrice ? 'text-orange-600' : 'text-green-600'}`}>
                  {priceNum < product.currentPrice
                    ? `Thấp hơn giá gốc ${Math.round((1 - priceNum / product.currentPrice) * 100)}%`
                    : 'Bằng hoặc cao hơn giá gốc'}
                </p>
              )}
              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setError(''); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Handshake size={16} /> Xác nhận & Chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
