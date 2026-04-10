'use client';

import React, { useEffect, useState } from 'react';
import { useSellerReviews } from '@/hooks/useSellerReviews';
import { Star, MessageCircle, BarChart3, Filter, Loader2 } from 'lucide-react';
import { ReviewCard } from '@/components/seller/reviews/ReviewCard';

export default function ReviewsManagementPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unreplied'>('all');
  const [filterStar, setFilterStar] = useState(0);
  const { reviews, stats, loading, fetchReviews, replyReview } = useSellerReviews();

  useEffect(() => { fetchReviews(); }, []); // eslint-disable-line

  const filteredReviews = reviews.filter(r => {
    const matchStar = filterStar === 0 || Math.round(r.rating) === filterStar;
    const matchReply = activeTab === 'all' || (activeTab === 'unreplied' && !r.seller_reply);
    return matchStar && matchReply;
  });
  
  const unrepliedCount = reviews.filter(r => !r.seller_reply).length;
  const replyRate = stats.total > 0 ? Math.round((stats.repliedCount / stats.total) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-500 shadow-sm">
               <Star size={28} fill="currentColor" />
            </div>
            <div>
               <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '--' : stats.average.toFixed(1)}</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Điểm trung bình</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
               <MessageCircle size={28} />
            </div>
            <div>
               <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '--' : stats.total}</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tổng đánh giá</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shadow-sm">
               <BarChart3 size={28} />
            </div>
            <div>
               <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '--' : `${replyRate}%`}</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tỉ lệ phản hồi</p>
            </div>
         </div>
      </div>

      {/* 2. SECTION DANH SÁCH */}
      <div className="space-y-5">
        
        {/* Toolbar Lọc */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
           {/* Tabs Trái */}
           <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveTab('unreplied')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'unreplied' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Chưa trả lời ({unrepliedCount})
              </button>
           </div>

           {/* Filter Sao Phải */}
           <div className="flex items-center gap-2 px-2 overflow-x-auto w-full md:w-auto">
              <span className="text-xs font-bold text-gray-400 uppercase mr-2 flex items-center gap-1"><Filter size={12}/> Lọc sao:</span>
              {[0, 5, 4, 3, 2, 1].map(star => (
                <button
                  key={star}
                  onClick={() => setFilterStar(star)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterStar === star 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {star === 0 ? 'All' : <>{star} <Star size={10} fill="currentColor"/></>}
                </button>
              ))}
           </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-500" size={36} /></div>
          ) : filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReply={replyReview}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <MessageCircle size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Không tìm thấy đánh giá</h3>
              <p className="text-gray-500 text-sm mt-1">Thử thay đổi bộ lọc hoặc chọn tab khác.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}