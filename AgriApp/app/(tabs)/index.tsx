import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '@/api/client';
import { Product } from '@/api/product';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { HomeHero } from '@/components/home/HomeHero';
import { TopSearches } from '@/components/home/TopSearches';
import { SectionHeader } from '@/components/home/SectionHeader';
import { CategoryChips } from '@/components/product/CategoryChips';
import { useProductSearch, useProducts } from '@/hooks/useProducts';
import { useCartStore, useCartSummary } from '@/store/cartStore';
import { ProductGridSection } from '@/components/home/ProductGridSection';
import { TopShopsSection } from '@/components/home/TopShopsSection';
import { PromoSection } from '@/components/home/PromoSection';
import { DailySuggestionsSection } from '@/components/home/DailySuggestionsSection';
import { GallerySection } from '@/components/home/GallerySection';
import { HomeFooterCard } from '@/components/home/HomeFooterCard';
import { useBehaviorTracker } from '@/hooks/useBehaviorTracker';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/utils/format';

type SellerDashboard = {
  totalRevenue?: number;
  totalOrders?: number;
  activeProducts?: number;
  revenueByMonth?: {
    month: string;
    revenue: number;
  }[];
  top3BestSelling?: {
    id: string;
    name: string;
    sold: number;
    avgRating?: number | null;
  }[];
  top3NeedImprovement?: {
    id: string;
    name: string;
    sold: number;
    avgRating?: number | null;
  }[];
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSeller = user?.role === 'SELLER';
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sellerDashboard, setSellerDashboard] = useState<SellerDashboard | null>(null);
  const [loadingSellerDashboard, setLoadingSellerDashboard] = useState(false);

  const { products, categories, isLoading, isError } = useProducts();
  const { data: homeRecommendations = [] } = useRecommendations('home');
  const addItem = useCartStore((state) => state.addItem);
  const { track } = useBehaviorTracker();
  const { totalItems } = useCartSummary();

  const filteredProducts = useProductSearch(products, keyword, selectedCategory);
  const suggestionProducts = homeRecommendations.length > 0 ? homeRecommendations : products.slice(0, 6);

  const handleOpenProduct = (productId: string, source: 'grid' | 'daily') => {
    void track('VIEW_PRODUCT', {
      targetId: productId,
      metadata: {
        context: 'home',
        source,
      },
      weight: 1,
    });

    router.push({ pathname: '/product/[id]', params: { id: productId } });
  };

  const handleAddToCart = (item: Product, source: 'grid' | 'daily') => {
    addItem(item);
    void track('ADD_TO_CART', {
      targetId: item.id,
      metadata: {
        context: 'home',
        source,
        category: item.category,
      },
      weight: 4,
    });
  };

  const handleSearchKeyword = (value: string) => {
    setKeyword(value);
    void track('SEARCH', {
      metadata: {
        keyword: value,
        context: 'home_top_search',
      },
      weight: 2,
    });
  };

  const handleOpenSearch = (source: 'hero_search' | 'hero_explore') => {
    void track('SEARCH', {
      metadata: {
        keyword,
        context: source,
      },
      weight: 2,
    });
    router.push('/(tabs)/search');
  };

  useFocusEffect(
    useCallback(() => {
      if (!isSeller || !accessToken) return;

      const fetchDashboard = async () => {
        setLoadingSellerDashboard(true);
        try {
          const res = await api.get<SellerDashboard>('/orders/seller-dashboard', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setSellerDashboard(res.data ?? null);
        } catch {
          setSellerDashboard(null);
        } finally {
          setLoadingSellerDashboard(false);
        }
      };

      void fetchDashboard();
    }, [isSeller, accessToken]),
  );

  if (isSeller) {
    const revenueData = sellerDashboard?.revenueByMonth ?? [];
    const peakRevenue = revenueData.reduce((max, item) => Math.max(max, Number(item.revenue || 0)), 0);
    const bestSelling = sellerDashboard?.top3BestSelling ?? [];
    const needImprovement = sellerDashboard?.top3NeedImprovement ?? [];

    return (
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3">
            <Text className="text-slate-900 text-3xl font-black">Tong quan kinh doanh</Text>
            <Text className="text-slate-400 mt-1">Day la tinh hinh kinh doanh cua gian hang.</Text>
          </View>

          {loadingSellerDashboard ? (
            <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center mb-3">
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : null}

          {!loadingSellerDashboard ? (
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3">
                <Text className="text-xs font-semibold text-emerald-700">Tong doanh thu</Text>
                <Text className="text-2xl font-black text-emerald-800 mt-1">{formatPrice(Number(sellerDashboard?.totalRevenue || 0))}</Text>
              </View>
              <View className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-3">
                <Text className="text-xs font-semibold text-blue-700">Tong don hang</Text>
                <Text className="text-2xl font-black text-blue-800 mt-1">{Number(sellerDashboard?.totalOrders || 0)}</Text>
              </View>
            </View>
          ) : null}

          {!loadingSellerDashboard ? (
            <View className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 mb-4">
              <Text className="text-xs font-semibold text-amber-700">San pham dang ban</Text>
              <Text className="text-2xl font-black text-amber-800 mt-1">{Number(sellerDashboard?.activeProducts || 0)}</Text>
            </View>
          ) : null}

          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            <Text className="font-bold text-slate-900 mb-1">Bieu do doanh thu theo thang</Text>
            <Text className="text-xs text-slate-400 mb-4">Tong quan doanh thu theo du lieu backend.</Text>

            {revenueData.length === 0 ? (
              <View className="rounded-xl border border-dashed border-slate-300 py-10 items-center">
                <Text className="text-slate-400 text-sm">Chua co du lieu doanh thu theo thang</Text>
              </View>
            ) : (
              <View>
                <View className="h-48 flex-row items-end justify-between border-b border-slate-100 pb-2">
                  {revenueData.map((point) => {
                    const revenueValue = Number(point.revenue || 0);
                    const heightPercent = peakRevenue > 0 ? Math.max(4, Math.round((revenueValue / peakRevenue) * 100)) : 4;

                    return (
                      <View key={`${point.month}-${revenueValue}`} className="items-center flex-1">
                        <View className="w-5 rounded-t-md bg-emerald-500/80" style={{ height: `${heightPercent}%` }} />
                      </View>
                    );
                  })}
                </View>
                <View className="flex-row justify-between mt-2">
                  {revenueData.map((point) => (
                    <Text key={`label-${point.month}`} className="text-[10px] text-slate-400 flex-1 text-center">
                      {point.month}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
              <Text className="font-bold text-slate-900 mb-3">San pham ban chay nhat</Text>
              {bestSelling.length === 0 ? (
                <Text className="text-slate-400 text-xs">Chua co du lieu.</Text>
              ) : (
                bestSelling.map((item, index) => (
                  <View key={`best-${item.id}`} className="mb-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 last:mb-0">
                    <Text className="font-semibold text-slate-800">{index + 1}. {item.name}</Text>
                    <Text className="text-xs text-slate-500 mt-1">Da ban: {Number(item.sold || 0)}</Text>
                  </View>
                ))
              )}
            </View>

            <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
              <Text className="font-bold text-slate-900 mb-3">Can cai thien (ban cham)</Text>
              {needImprovement.length === 0 ? (
                <Text className="text-slate-400 text-xs">Chua co du lieu.</Text>
              ) : (
                needImprovement.map((item, index) => (
                  <View key={`slow-${item.id}`} className="mb-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 last:mb-0">
                    <Text className="font-semibold text-slate-800">{index + 1}. {item.name}</Text>
                    <Text className="text-xs text-slate-500 mt-1">Da ban: {Number(item.sold || 0)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <HomeHero
          cartCount={totalItems}
          onPressCart={() => router.push('/(tabs)/cart')}
          keyword={keyword}
          onChangeKeyword={setKeyword}
          onPressExplore={() => handleOpenSearch('hero_explore')}
          onPressSearch={() => handleOpenSearch('hero_search')}
        />

        <TopSearches onPressKeyword={handleSearchKeyword} />

        <View className="mb-4">
          <SectionHeader title="Danh mục sản phẩm" subtitle="Lọc nhanh theo nhóm sản phẩm" />
          <CategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        {isLoading ? <LoadingState /> : null}
        {isError ? (
          <EmptyState
            title="Không tải được dữ liệu"
            description="Kiểm tra EXPO_PUBLIC_API_URL và backend NestJS đang chạy trên Railway."
          />
        ) : null}

        {!isLoading && !isError ? (
          <ProductGridSection
            title="Danh sách sản phẩm"
            subtitle="Các sản phẩm đang hoạt động"
            products={filteredProducts.slice(0, 8)}
            onPressProduct={(productId) => handleOpenProduct(productId, 'grid')}
            onAddToCart={(item) => handleAddToCart(item, 'grid')}
          />
        ) : null}

        <TopShopsSection
          products={products}
          onPressShop={() => router.push('/(tabs)/search')}
        />

        <PromoSection />

        <DailySuggestionsSection
          products={suggestionProducts}
          title={homeRecommendations.length > 0 ? 'Goi y danh rieng cho ban' : 'Goi y hom nay'}
          subtitle={homeRecommendations.length > 0 ? 'Xep hang theo hanh vi xem, tim kiem va gio hang' : 'San pham duoc chon ngau nhien tu BE'}
          onPressProduct={(productId) => handleOpenProduct(productId, 'daily')}
          onAddToCart={(item) => handleAddToCart(item, 'daily')}
        />

        <GallerySection />
        <HomeFooterCard />
      </ScrollView>
    </ScreenContainer>
  );
}