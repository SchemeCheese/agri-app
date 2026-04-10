// src/components/seller/reviews/ReviewCard.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Reply, MoreHorizontal, CheckCircle2, Store, Send, Loader2 } from 'lucide-react';
import type { SellerReview } from '@/hooks/useSellerReviews';

interface ReviewProps {
  review: SellerReview;
  onReply: (id: string, reply: string) => Promise<void>;
}

export const ReviewCard = ({ review, onReply }: ReviewProps) => {
  const isReplied = !!review.seller_reply;
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    await onReply(review.id, replyText.trim());
    setReplyText('');
    setIsExpanded(false);
    setReplying(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      
      {/* 1. HEADER: User info & Actions (Gọn gàng hơn) */}
      <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <div className="flex items-center gap-3">
          {/* Avatar nhỏ gọn */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {review.buyer?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none">{review.buyer?.full_name ?? 'Người dùng'}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        {/* Trạng thái & Menu */}
        <div className="flex items-center gap-3">
           <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
             isReplied 
               ? 'bg-green-50 text-green-700 border-green-100' 
               : 'bg-orange-50 text-orange-700 border-orange-100'
           }`}>
             {isReplied ? <CheckCircle2 size={10}/> : <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>}
             {isReplied ? 'Đã xong' : 'Chờ trả lời'}
           </div>
           <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16}/></button>
        </div>
      </div>

      {/* 2. BODY: Grid layout (70% Content - 30% Product) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* CỘT TRÁI (8 phần): Nội dung đánh giá */}
        <div className="md:col-span-8 flex flex-col gap-3">
           {/* Rating */}
           <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} className={s <= review.rating ? 'fill-current' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">{review.rating === 5 ? 'Cực kỳ hài lòng' : review.rating >= 4 ? 'Hài lòng' : 'Chưa hài lòng'}</span>
           </div>

           {/* Comment Text */}
           <div className="text-gray-800 text-sm leading-relaxed">
              {review.comment}
           </div>

           {/* Images Grid (Khách upload) */}
           {review.review_images && review.review_images.length > 0 && (
             <div className="flex gap-2 mt-1">
                {review.review_images.map((img: string, idx: number) => (
                   <div key={idx} className="w-16 h-16 relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90">
                      <Image src={img} alt="review-img" fill className="object-cover"/>
                   </div>
                ))}
             </div>
           )}

           {/* SHOP REPLY (Đã làm nổi bật hơn) */}
           {isReplied ? (
             <div className="mt-2 bg-blue-50/50 p-3 rounded-lg border-l-4 border-blue-500 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 mb-1">
                   <Store size={14} className="text-blue-600"/>
                   <span className="text-xs font-bold text-blue-900">Phản hồi của Shop</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{review.seller_reply}</p>
             </div>
           ) : isExpanded ? (
             <div className="mt-2 space-y-2">
               <textarea
                 rows={3}
                 value={replyText}
                 onChange={e => setReplyText(e.target.value)}
                 placeholder="Nhập phản hồi của shop..."
                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
               />
               <div className="flex gap-2">
                 <button
                   onClick={handleSubmitReply}
                   disabled={replying || !replyText.trim()}
                   className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition"
                 >
                   {replying ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                   Gửi phản hồi
                 </button>
                 <button
                   onClick={() => setIsExpanded(false)}
                   className="text-xs text-gray-500 font-bold px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                 >
                   Hủy
                 </button>
               </div>
             </div>
           ) : (
             <div className="mt-2">
               <button
                 onClick={() => setIsExpanded(true)}
                 className="flex items-center gap-2 text-sm text-green-600 font-bold hover:bg-green-50 px-3 py-1.5 rounded-lg w-fit transition-colors"
               >
                 <Reply size={16}/> Viết phản hồi ngay
               </button>
             </div>
           )}
        </div>

        {/* CỘT PHẢI (4 phần): Sản phẩm (Đã làm to và rõ hơn) */}
        <div className="md:col-span-4">
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex gap-3 items-center hover:bg-white hover:shadow-md hover:border-green-200 transition-all cursor-pointer group h-full">
              {/* Ảnh to hơn (w-20) */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                 {review.products?.[0]?.images?.[0] && <Image src={review.products[0].images[0]} alt="sp" fill className="object-cover group-hover:scale-105 transition-transform" />}
              </div>
              <div className="min-w-0 flex flex-col justify-center h-full">
                 <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                    <PackageIcon /> Sản phẩm
                 </p>
                 <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
                    {review.products?.[0]?.name}
                 </h4>
                 {/* Giá hoặc SKU (Giả lập) */}
                 <p className="text-xs text-gray-500 mt-1">SKU: SP-{review.id.slice(0,4)}</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// Icon package nhỏ
const PackageIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);