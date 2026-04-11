import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ProductCard } from '@/components/product/ProductCard';
import { useSellerDetail } from '@/hooks/useProducts';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';
import { initiateChat } from '@/api/chat';

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View className="px-4 mb-3 mt-3">
    <Text className="text-[18px] font-black text-slate-900">{title}</Text>
    {subtitle ? <Text className="text-xs text-slate-500 mt-1">{subtitle}</Text> : null}
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
          <View className="mx-4 mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <View className="h-20 bg-emerald-600" />
            <View className="px-4 pb-4">
              <View className="-mt-7 flex-row items-end">
                <View className="w-16 h-16 rounded-full bg-white p-1 border border-slate-200">
                  <Image source={{ uri: resolveImageUrl(data.shop?.avatar_url ?? data.shop?.avatar ?? undefined) }} className="w-full h-full rounded-full" />
                </View>
                <View className="ml-3 flex-1 pb-1">
                  <Text className="font-black text-slate-900" numberOfLines={1}>{shopName}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{data.shop?.address ?? data.shop?.location ?? 'Chua cap nhat dia chi'}</Text>
                </View>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <View className="items-center">
                  <Text className="text-xs text-slate-500">Danh gia</Text>
                  <Text className="text-emerald-700 font-black">{Number(data.shop?.rating ?? data.averageRating ?? 5).toFixed(1)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-slate-500">Da ban</Text>
                  <Text className="text-slate-900 font-black">{Number(data.shop?.totalSold ?? data.totalSold ?? 0)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-slate-500">San pham</Text>
                  <Text className="text-slate-900 font-black">{Number(data.shop?.totalProducts ?? products.length)}</Text>
                </View>
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

          <View className="mx-4 mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <Text className="text-xs font-black text-orange-700">Ma giam gia cua shop</Text>
            <Text className="text-sm text-orange-700 mt-1">Nhap ma: <Text className="font-black">AGRI10</Text> de giam 10% don hang.</Text>
          </View>

          <SectionTitle title="Goi y cho ban" subtitle="San pham noi bat cua shop" />
          <View className="px-4 flex-row flex-wrap justify-between">
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
          <View className="px-4 flex-row flex-wrap justify-between">
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
          <View className="px-4 flex-row flex-wrap justify-between">
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
