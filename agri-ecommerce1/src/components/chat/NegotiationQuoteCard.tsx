'use client';

import React from 'react';
import { CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import { QuoteData } from '@/types/chat';
import { formatCurrency } from '@/utils/vi';

interface Props {
  quote:     QuoteData;
  /** true = người xem là buyer (có nút Accept/Reject) */
  isBuyer:   boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export const NegotiationQuoteCard = ({ quote, isBuyer, onAccept, onReject }: Props) => {
  const total = quote.price * quote.quantity;

  return (
    <div className="bg-white border border-green-200 rounded-2xl p-4 shadow-sm w-full max-w-[320px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <ClipboardList size={16} className="text-green-600" />
        <span className="text-sm font-bold text-gray-800">📋 Báo giá từ người bán</span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-gray-700 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Sản phẩm:</span>
          <span className="font-semibold">{quote.productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Số lượng:</span>
          <span className="font-semibold">{quote.quantity} {quote.unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Giá đề xuất:</span>
          <span className="font-bold text-green-600">
            {formatCurrency(quote.price)}/{quote.unit}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2 mt-1">
          <span className="text-gray-500 font-medium">Tổng cộng:</span>
          <span className="font-bold text-green-700 text-base">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Actions / Status */}
      {quote.status === 'PENDING' && isBuyer && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition shadow-sm"
          >
            <CheckCircle2 size={15} /> Chấp nhận &amp; Đặt hàng
          </button>
          <button
            onClick={onReject}
            className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2.5 rounded-xl text-sm font-bold transition"
          >
            <XCircle size={15} /> Từ chối
          </button>
        </div>
      )}

      {quote.status === 'PENDING' && !isBuyer && (
        <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-xl text-sm font-medium border border-yellow-100 text-center">
          ⏳ Đang chờ người mua phản hồi...
        </div>
      )}

      {quote.status === 'ACCEPTED' && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-sm font-bold border border-green-200">
          <CheckCircle2 size={15} /> Đã chấp nhận
        </div>
      )}

      {quote.status === 'REJECTED' && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-bold border border-red-100">
          <XCircle size={15} /> Đã từ chối
        </div>
      )}

      {quote.status === 'EXPIRED' && (
        <div className="bg-gray-50 text-gray-500 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 text-center">
          ⌛ Đã hết hạn
        </div>
      )}
    </div>
  );
};
