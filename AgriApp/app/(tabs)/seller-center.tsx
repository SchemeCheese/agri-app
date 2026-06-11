import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

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

type SellerDashboard = {
  totalRevenue?: number;
  totalOrders?: number;
};

export default function SellerCenterScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSeller = user?.role === 'SELLER';

  const [activeTab, setActiveTab] = useState<'vouchers' | 'reviews'>('vouchers');
  const [vouchers, setVouchers] = useState<SellerVoucher[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
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

  // Header stats — tách khỏi fetchData để luôn có số liệu dù đang ở tab nào.
  const fetchDashboard = useCallback(async () => {
    if (!isSeller || !accessToken) return;
    try {
      const res = await api.get<SellerDashboard>('/orders/seller-dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDashboard(res.data ?? null);
    } catch {
      setDashboard(null);
    }
  }, [isSeller, accessToken]);

  useFocusEffect(useCallback(() => {
    fetchData();
    fetchDashboard();
  }, [fetchData, fetchDashboard]));

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

  const shopName = user?.full_name || 'Cua hang cua ban';
  const activeVouchers = vouchers.filter((v) => v.is_active).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        {/* ── Hero header ─────────────────────────────────────────────── */}
        <View className="bg-emerald-600 px-4 pt-5 pb-16 rounded-b-3xl">
          <Text className="text-emerald-50 text-xs font-semibold tracking-wide">QUAN LY CUA HANG</Text>
          <View className="flex-row items-center mt-3">
            <View className="w-14 h-14 rounded-2xl bg-white/20 overflow-hidden items-center justify-center">
              {user?.avatar ? (
                <Image source={{ uri: resolveImageUrl(user.avatar) }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <FontAwesome name="shopping-basket" size={22} color="#FFFFFF" />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white text-xl font-black" numberOfLines={1}>{shopName}</Text>
              <Text className="text-emerald-100 text-xs mt-0.5">Trung tam nguoi ban</Text>
            </View>
          </View>
        </View>

        {/* ── Stat cards (đè lên hero) ─────────────────────────────────── */}
        <View className="px-4 -mt-10">
          <View className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-row p-1">
            <StatCell icon="money" label="Doanh thu" value={formatPrice(Number(dashboard?.totalRevenue || 0))} />
            <View className="w-px bg-slate-100 my-2" />
            <StatCell icon="shopping-cart" label="Don hang" value={String(Number(dashboard?.totalOrders || 0))} />
            <View className="w-px bg-slate-100 my-2" />
            <StatCell icon="star" label="Danh gia" value={avgRating ?? '—'} />
          </View>
        </View>

        {/* ── Trợ lý AI (nổi bật) ──────────────────────────────────────── */}
        <View className="px-4 mt-4">
          <View className="rounded-2xl bg-indigo-600 p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                <FontAwesome name="magic" size={18} color="#FFFFFF" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-black text-base">Tro ly AI AgriBot</Text>
                <Text className="text-indigo-100 text-xs mt-0.5">Tu van ban hang, gia ca, ton kho — goi y ca san pham</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-white rounded-xl py-3 items-center mt-3 flex-row justify-center"
              onPress={() => router.push('/ai-chat')}
              activeOpacity={0.85}
            >
              <FontAwesome name="comments" size={14} color="#4F46E5" />
              <Text className="text-indigo-700 font-bold ml-2">Chat voi tro ly AI</Text>
            </TouchableOpacity>
            <View className="flex-row items-center mt-3">
              <FontAwesome name="lightbulb-o" size={12} color="#C7D2FE" />
              <Text className="text-indigo-100 text-[11px] ml-1.5 flex-1">
                Meo: khi them san pham, bam "AI Goi y tu anh" de AI tu dien ten, gia, danh muc.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tab switcher ─────────────────────────────────────────────── */}
        <View className="px-4 pt-4 flex-row gap-2">
          <TabPill
            label={`Ma giam gia${activeVouchers ? ` (${activeVouchers})` : ''}`}
            active={activeTab === 'vouchers'}
            onPress={() => setActiveTab('vouchers')}
          />
          <TabPill
            label={`Danh gia${reviews.length ? ` (${reviews.length})` : ''}`}
            active={activeTab === 'reviews'}
            onPress={() => setActiveTab('reviews')}
          />
        </View>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        <View className="px-4 pt-3 pb-6">
          {loading ? (
            <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : null}

          {!loading && activeTab === 'vouchers' ? (
            <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
              <Text className="text-sm font-black text-slate-900 mb-3">Tao voucher moi</Text>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-2" value={code} onChangeText={setCode} placeholder="MA VOUCHER" autoCapitalize="characters" />
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

          {!loading && activeTab === 'vouchers' && vouchers.length === 0 ? (
            <View className="bg-white rounded-2xl border border-slate-100 py-12 px-5 items-center">
              <EmptyState title="Chua co voucher" description="Tao ma giam gia dau tien de thu hut khach hang." />
            </View>
          ) : null}

          {!loading && activeTab === 'vouchers' && vouchers.length > 0
            ? vouchers.map((v) => (
                <View key={v.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <FontAwesome name="ticket" size={14} color="#16A34A" />
                      <Text className="font-black text-slate-900 ml-2">{v.code}</Text>
                    </View>
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
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-slate-900">{r.buyer?.full_name || 'Khach hang'}</Text>
                    <Text className="text-amber-500 font-bold text-xs">{'★'.repeat(Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0))))}</Text>
                  </View>
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
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCell({ icon, label, value }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; value: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <FontAwesome name={icon} size={15} color="#16A34A" />
      <Text className="text-slate-900 font-black text-sm mt-1.5" numberOfLines={1}>{value}</Text>
      <Text className="text-slate-400 text-[11px] mt-0.5">{label}</Text>
    </View>
  );
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      className={`px-4 py-2 rounded-xl ${active ? 'bg-emerald-600' : 'bg-white border border-slate-200'}`}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text className={`${active ? 'text-white' : 'text-slate-700'} font-bold`}>{label}</Text>
    </TouchableOpacity>
  );
}
