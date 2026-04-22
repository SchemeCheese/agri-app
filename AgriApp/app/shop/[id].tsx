import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ProductCard } from '@/components/product/ProductCard';
import { useSellerDetail, useShopVouchers } from '@/hooks/useProducts';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';
import { initiateChat } from '@/api/chat';
import { saveVoucher } from '@/api/voucher';

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View className="px-4 mb-2 mt-3">
    <Text className="text-[18px] font-black text-slate-900">{title}</Text>
    {subtitle ? <Text className="text-xs text-slate-500 mt-1">{subtitle}</Text> : null}
  </View>
);

const MetricPill = ({ icon, label, value }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; value: string | number }) => (
  <View className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 items-center">
    <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center mb-1">
      <FontAwesome name={icon} size={11} color="#0F766E" />
    </View>
    <Text className="text-[10px] text-slate-500">{label}</Text>
    <Text className="text-sm font-black text-slate-900 mt-0.5">{value}</Text>
  </View>
);

export default function SellerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const sellerId = params.id ?? '';

  const { data, isLoading, isError } = useSellerDetail(sellerId);
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const featuredProducts = products.slice(0, 6);
  const topSellingProducts = products.slice(0, 6);
  const shopName = data?.shop?.store_name ?? data?.shop?.name ?? data?.full_name ?? 'Agri Shop';
  const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);

  const {
    data: shopVouchers = [],
    isLoading: loadingShopVouchers,
  } = useShopVouchers(sellerId, accessToken);

  const handleChatWithSeller = async () => {
    if (!sellerId) return;

    if (!user || !accessToken) {
      router.push('/auth/login');
      return;
    }

    try {
      const conversation = await initiateChat(accessToken, { partnerId: sellerId });
      router.push({ pathname: '/(tabs)/chat', params: { conversationId: conversation.conversationId } });
    } catch {
      // no-op for now
    }
  };

  const handleSaveVoucher = async (voucherId: string) => {
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'BUYER') {
      Alert.alert('Thong bao', 'Chi tai khoan nguoi mua moi co the luu voucher.');
      return;
    }

    try {
      setSavingVoucherId(voucherId);
      await saveVoucher(accessToken, voucherId);
      Alert.alert('Thanh cong', 'Da luu voucher vao vi cua ban.');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      const normalized = Array.isArray(message) ? message[0] : message;
      Alert.alert('Khong the luu voucher', normalized ?? 'Vui long thu lai sau.');
    } finally {
      setSavingVoucherId(null);
    }
  };

  const voucherAccentColors = ['bg-orange-500', 'bg-emerald-500', 'bg-rose-500', 'bg-sky-500'];

  const formatVoucherTitle = (discountType: 'PERCENT' | 'FIXED', discountValue: number) => {
    if (discountType === 'PERCENT') return `${discountValue}%`;
    return formatPrice(discountValue).replace(' ₫', '');
  };

  const formatVoucherDate = (value?: string) => {
    if (!value) return '--/--/----';
    return new Date(value).toLocaleDateString('vi-VN');
  };

  return (
    <ScreenContainer>
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <FontAwesome name="chevron-left" size={14} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-slate-900">Chi tiet nguoi ban</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <FontAwesome name="ellipsis-v" size={14} color="#374151" />
        </TouchableOpacity>
      </View>

      {isLoading ? <LoadingState /> : null}
      {isError ? <EmptyState title="Khong tai duoc thong tin shop" /> : null}

      {!isLoading && !isError && data ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="mx-4 mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
            <View className="h-16 bg-emerald-600" />
            <View className="px-4 pb-4">
              <View className="-mt-6 flex-row items-end">
                <View className="w-16 h-16 rounded-full bg-white p-1 border border-slate-200">
                  <Image source={{ uri: resolveImageUrl(data.shop?.avatar_url ?? data.shop?.avatar ?? undefined) }} className="w-full h-full rounded-full" />
                </View>
                <View className="ml-3 flex-1 pb-1">
                  <Text className="font-black text-slate-900" numberOfLines={1}>{shopName}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{data.shop?.address ?? data.shop?.location ?? 'Chua cap nhat dia chi'}</Text>
                </View>
                <View className="mb-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1 flex-row items-center">
                  <FontAwesome name="check-circle" size={10} color="#15803D" />
                  <Text className="ml-1 text-[10px] font-bold text-emerald-700">Uy tin</Text>
                </View>
              </View>

              <View className="mt-3 flex-row gap-2">
                <MetricPill icon="star" label="Danh gia" value={Number(data.shop?.rating ?? data.averageRating ?? 5).toFixed(1)} />
                <MetricPill icon="shopping-basket" label="Da ban" value={Number(data.shop?.totalSold ?? data.totalSold ?? 0)} />
                <MetricPill icon="th-large" label="San pham" value={Number(data.shop?.totalProducts ?? products.length)} />
              </View>

              <View className="mt-3 flex-row gap-2">
                <TouchableOpacity className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 items-center" onPress={() => void handleChatWithSeller()}>
                  <Text className="text-emerald-700 font-bold">Chat voi shop</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 items-center">
                  <Text className="text-slate-700 font-bold">Theo doi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <SectionTitle title="Ma giam gia cua shop" />
          {!accessToken ? (
            <View className="mx-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Text className="text-xs text-slate-600">Dang nhap de xem va luu voucher cua shop nay.</Text>
            </View>
          ) : loadingShopVouchers ? (
            <View className="mx-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Text className="text-xs text-slate-600">Dang tai voucher...</Text>
            </View>
          ) : shopVouchers.length === 0 ? (
            <View className="mx-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Text className="text-xs text-slate-600">Shop hien chua co voucher kha dung.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              <View className="flex-row gap-3">
                {shopVouchers.map((voucher, index) => {
                  const color = voucherAccentColors[index % voucherAccentColors.length];
                  const discountLabel =
                    voucher.discount_type === 'PERCENT'
                      ? `Giam ${voucher.discount_value}% (toi da ${formatPrice(Number(voucher.max_discount_amount || 0))})`
                      : `Giam ${formatPrice(Number(voucher.discount_value || 0))}`;

                  const remainingCount = Math.max(
                    Number(voucher.usage_limit || 0) - Number(voucher.used_count || 0),
                    0,
                  );

                  return (
                    <View key={voucher.id} className="w-60 rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <View className="flex-row">
                        <View className={`w-16 ${color} items-center justify-center px-1 py-3`}>
                          <Text className="text-white text-[10px] font-black text-center">{formatVoucherTitle(voucher.discount_type, Number(voucher.discount_value || 0))}</Text>
                        </View>
                        <View className="flex-1 px-3 py-2.5">
                          <Text className="text-[10px] text-slate-500">MA: <Text className="font-black text-slate-800">{voucher.code}</Text></Text>
                          <Text className="text-[11px] text-slate-700 mt-1">{discountLabel}</Text>
                          <Text className="text-[10px] text-slate-500 mt-1">Don toi thieu: {formatPrice(Number(voucher.min_order_value || 0))}</Text>
                          <Text className="text-[10px] text-slate-500 mt-0.5">Het han: {formatVoucherDate(voucher.valid_to)}</Text>
                          <Text className="text-[10px] text-slate-500 mt-0.5">Con lai: {remainingCount} luot</Text>

                          <TouchableOpacity
                            className="mt-2 self-start bg-orange-500 rounded-full px-3 py-1"
                            onPress={() => void handleSaveVoucher(voucher.id)}
                            disabled={savingVoucherId === voucher.id || user?.role !== 'BUYER'}
                          >
                            <Text className="text-[10px] text-white font-black">
                              {savingVoucherId === voucher.id
                                ? 'Dang luu...'
                                : user?.role === 'BUYER'
                                  ? 'Luu ngay'
                                  : 'Chi buyer'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View className="mx-4 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <Text className="text-xs font-black text-emerald-700">Ban muon mua nhieu?</Text>
            <Text className="text-xs text-emerald-700 mt-1">Chat voi shop de thuong luong gia tot hon cho don lon.</Text>
          </View>

          <SectionTitle title="Goi y cho ban" subtitle="San pham noi bat cua shop" />
          <View className="mx-4 rounded-2xl border border-slate-200 bg-white px-3 pt-3 flex-row flex-wrap justify-between">
            {featuredProducts.map((item) => (
              <ProductCard
                key={`featured-${item.id}`}
                product={item}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                onAddToCart={() => addItem(item)}
              />
            ))}
          </View>

          <SectionTitle title="San pham ban chay" />
          <View className="mx-4 rounded-2xl border border-slate-200 bg-white px-3 pt-3 flex-row flex-wrap justify-between">
            {topSellingProducts.map((item) => (
              <ProductCard
                key={`top-${item.id}`}
                product={item}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                onAddToCart={() => addItem(item)}
              />
            ))}
          </View>

          <SectionTitle title="Danh sach san pham" subtitle={`${products.length} san pham`} />
          <View className="mx-4 rounded-2xl border border-slate-200 bg-white px-3 pt-3 flex-row flex-wrap justify-between">
            {products.map((item) => (
              <ProductCard
                key={`all-${item.id}`}
                product={item}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                onAddToCart={() => addItem(item)}
              />
            ))}
          </View>

          {products.length === 0 ? (
            <View className="px-4 mt-3">
              <EmptyState title="Shop chua co san pham" description="Vui long quay lai sau." />
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </ScreenContainer>
  );
}
