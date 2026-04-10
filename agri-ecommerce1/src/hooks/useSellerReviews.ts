import { useState, useCallback } from 'react';
import api from '@/lib/axios';

export interface SellerReview {
  id: string;
  rating: number;
  comment?: string;
  review_images?: string[];
  created_at: string;
  seller_reply?: string;
  seller_replied_at?: string;
  buyer: {
    id: string;
    full_name: string;
    avatar?: string;
  };
  products: {
    id: string;
    name: string;
    images: string[];
  }[];
  order_id?: string;
}

export interface ReviewCounts {
  all: number;
  replied: number;
  unreplied: number;
}

export interface ReviewStats {
  average: number;
  total: number;
  repliedCount: number;
  starBreakdown: Record<number, number>;
}

export function useSellerReviews() {
  const [reviews, setReviews]     = useState<SellerReview[]>([]);
  const [counts, setCounts]       = useState<ReviewCounts>({ all: 0, replied: 0, unreplied: 0 });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reviews/shop-reviews');
      // BE now returns { counts, reviews } instead of a plain array
      const data = res.data;
      setReviews(Array.isArray(data) ? data : (data.reviews ?? []));
      if (data.counts) setCounts(data.counts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải đánh giá');
    } finally {
      setLoading(false);
    }
  }, []);

  const replyReview = async (reviewId: string, reply: string) => {
    // BE: PATCH /reviews/:id/reply  body: { reply }
    const res = await api.patch(`/reviews/${reviewId}/reply`, { reply });
    // Cập nhật local state ngay lập tức
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, seller_reply: reply, seller_replied_at: new Date().toISOString() }
          : r
      )
    );
    setCounts(prev => ({ ...prev, replied: prev.replied + 1, unreplied: Math.max(0, prev.unreplied - 1) }));
    return res.data;
  };

  const stats: ReviewStats = {
    average: reviews.length > 0
      ? Number((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1))
      : 0,
    total: counts.all || reviews.length,
    repliedCount: counts.replied || reviews.filter(r => r.seller_reply).length,
    starBreakdown: [1, 2, 3, 4, 5].reduce((acc, s) => {
      acc[s] = reviews.filter(r => Math.round(r.rating) === s).length;
      return acc;
    }, {} as Record<number, number>),
  };

  return { reviews, counts, loading, error, fetchReviews, replyReview, stats };
}
