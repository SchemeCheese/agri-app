import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/utils/format';

type SellerVoucher = {
  id: string;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number;
  usage_limit?: number;
  used_count?: number;
  is_active?: boolean;
};

type ReviewData = {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  seller_reply?: string | null;
  buyer?: {
    full_name?: string;
  };
  products?: {
    id: string;
    name: string;
  }[];
};

export default function SellerCenterScreen() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSeller = user?.role === 'SELLER';

  const [activeTab, setActiveTab] = useState<'vouchers' | 'reviews'>('vouchers');
  const [vouchers, setVouchers] = useState<SellerVoucher[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrder, setMinOrder] = useState('100000');
  const [maxDiscount, setMaxDiscount] = useState('50000');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [usageLimit, setUsageLimit] = useState('100');

  const fetchData = useCallback(async () => {
    if (!isSeller || !accessToken) return;

    setLoading(true);
    try {
      if (activeTab === 'vouchers') {
        const res = await api.get<SellerVoucher[]>('/vouchers/mine', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setVouchers(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await api.get<{ reviews?: ReviewData[] }>('/reviews/shop-reviews?filter=all', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
      }
    } catch {
      if (activeTab === 'vouchers') setVouchers([]);
      else setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [isSeller, accessToken, activeTab]);

  useFocusEffect(useCallback(() => {
    fetchData();
  }, [fetchData]));

  const handleCreateVoucher = async () => {
    if (!accessToken || !code.trim()) return;

    setCreatingVoucher(true);
    try {
      await api.post(
        '/vouchers',
        {
          code: code.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue || 0),
          min_order_value: Number(minOrder || 0),
          max_discount_amount: Number(maxDiscount || 0),
          valid_from: new Date(`${validFrom}T00:00:00`).toISOString(),
          valid_to: new Date(`${validTo}T23:59:59`).toISOString(),
          usage_limit: Number(usageLimit || 100),
          is_active: true,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setCode('');
      await fetchData();
    } catch {
      // no-op
    } finally {
      setCreatingVoucher(false);
    }
  };

  const handleReply = async () => {
    if (!accessToken || !replyReviewId || !replyText.trim()) return;

    setReplying(true);
    try {
      await api.patch(
        `/reviews/${replyReviewId}/reply`,
        { reply: replyText.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setReplyReviewId(null);
      setReplyText('');
      await fetchData();
    } catch {
      // no-op
    } finally {
      setReplying(false);
    }
  };

  if (!isSeller) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState title="Chuc nang chi danh cho Seller" description="Vui long dang nhap tai khoan nguoi ban." />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 py-3 border-b border-slate-100 bg-white">
        <Text className="text-2xl font-bold text-slate-900">Ma giam gia va Danh gia</Text>
      </View>

      <View className="px-4 pt-3 flex-row gap-2">
        <TouchableOpacity
          className={`px-4 py-2 rounded-xl ${activeTab === 'vouchers' ? 'bg-emerald-600' : 'bg-slate-200'}`}
          onPress={() => setActiveTab('vouchers')}
        >
          <Text className={`${activeTab === 'vouchers' ? 'text-white' : 'text-slate-700'} font-bold`}>Ma giam gia</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 rounded-xl ${activeTab === 'reviews' ? 'bg-emerald-600' : 'bg-slate-200'}`}
          onPress={() => setActiveTab('reviews')}
        >
          <Text className={`${activeTab === 'reviews' ? 'text-white' : 'text-slate-700'} font-bold`}>Danh gia</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
            <ActivityIndicator size="large" color="#16A34A" />
          </View>
        ) : null}

        {!loading && activeTab === 'vouchers' ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            <Text className="text-sm font-black text-slate-900 mb-3">Tao voucher moi</Text>
            <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-2" value={code} onChangeText={setCode} placeholder="MA VOUCHER" />
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity className={`flex-1 rounded-xl py-2 items-center border ${discountType === 'PERCENT' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`} onPress={() => setDiscountType('PERCENT')}>
                <Text className="font-bold">%</Text>
              </TouchableOpacity>
              <TouchableOpacity className={`flex-1 rounded-xl py-2 items-center border ${discountType === 'FIXED' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`} onPress={() => setDiscountType('FIXED')}>
                <Text className="font-bold">VND</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-2">
              <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" placeholder="Gia tri" />
              <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" value={usageLimit} onChangeText={setUsageLimit} keyboardType="numeric" placeholder="Usage" />
            </View>
            <View className="flex-row gap-2 mb-2">
              <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" value={minOrder} onChangeText={setMinOrder} keyboardType="numeric" placeholder="Don toi thieu" />
              <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="numeric" placeholder="Giam toi da" />
            </View>
            <View className="flex-row gap-2 mb-3">
              <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" value={validFrom} onChangeText={setValidFrom} placeholder="YYYY-MM-DD" />
              <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" value={validTo} onChangeText={setValidTo} placeholder="YYYY-MM-DD" />
            </View>
            <TouchableOpacity className={`rounded-xl py-3 items-center ${creatingVoucher || !code.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`} onPress={handleCreateVoucher} disabled={creatingVoucher || !code.trim()}>
              <Text className="text-white font-bold">{creatingVoucher ? 'Dang tao...' : 'Tao voucher'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && activeTab === 'vouchers' && vouchers.length > 0
          ? vouchers.map((v) => (
              <View key={v.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-black text-slate-900">{v.code}</Text>
                  <Text className={`text-xs font-bold ${v.is_active ? 'text-emerald-600' : 'text-slate-500'}`}>{v.is_active ? 'Dang hoat dong' : 'Da tat'}</Text>
                </View>
                <Text className="text-sm text-slate-700 mt-2">{v.discount_type === 'PERCENT' ? `Giam ${v.discount_value}%` : `Giam ${formatPrice(v.discount_value)}`}</Text>
                <Text className="text-xs text-slate-500 mt-1">Da dung {Number(v.used_count || 0)} / {Number(v.usage_limit || 0)}</Text>
              </View>
            ))
          : null}

        {!loading && activeTab === 'reviews' && reviews.length === 0 ? (
          <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
            <EmptyState title="Chua co danh gia" description="Khi co danh gia tu khach, ban co the phan hoi tai day." />
          </View>
        ) : null}

        {!loading && activeTab === 'reviews'
          ? reviews.map((r) => (
              <View key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                <Text className="font-bold text-slate-900">{r.buyer?.full_name || 'Khach hang'}</Text>
                <Text className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString('vi-VN')}</Text>
                <Text className="text-sm text-slate-700 mt-2">{r.comment || 'Khong co noi dung'}</Text>
                {r.seller_reply ? (
                  <View className="mt-3 bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400">
                    <Text className="text-xs font-bold text-blue-700">Phan hoi cua shop</Text>
                    <Text className="text-xs text-slate-700 mt-1">{r.seller_reply}</Text>
                  </View>
                ) : (
                  <View className="mt-3">
                    <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-2" placeholder="Viet phan hoi..." value={replyReviewId === r.id ? replyText : ''} onChangeText={(txt) => { setReplyReviewId(r.id); setReplyText(txt); }} />
                    <TouchableOpacity className={`rounded-xl py-2.5 items-center ${replying || replyReviewId !== r.id || !replyText.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`} onPress={handleReply} disabled={replying || replyReviewId !== r.id || !replyText.trim()}>
                      <Text className="text-white font-bold">{replying ? 'Dang gui...' : 'Gui phan hoi'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          : null}
      </ScrollView>
    </ScreenContainer>
  );
}
