import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

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
    const totalRevenue = Number(sellerDashboard?.totalRevenue || 0);
    const totalOrders = Number(sellerDashboard?.totalOrders || 0);
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const shopName = user?.full_name || 'Gian hang cua ban';

    return (
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Hero */}
          <View className="bg-emerald-600 px-5 pt-5 pb-16 rounded-b-3xl">
            <Text className="text-emerald-50 text-xs font-semibold tracking-wide">TONG QUAN KINH DOANH</Text>
            <Text className="text-white text-2xl font-black mt-1" numberOfLines={1}>{shopName}</Text>
            <Text className="text-emerald-100 text-xs mt-0.5">Tinh hinh kinh doanh cua gian hang</Text>
          </View>

          <View className="px-4 -mt-10">
            {loadingSellerDashboard ? (
              <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
                <ActivityIndicator size="large" color="#16A34A" />
              </View>
            ) : (
              <>
                {/* Stat grid 2x2 */}
                <View className="flex-row gap-3 mb-3">
                  <DashStat icon="money" color="bg-emerald-500" title="Doanh thu" value={formatPrice(totalRevenue)} />
                  <DashStat icon="shopping-cart" color="bg-blue-500" title="Don hang" value={String(totalOrders)} />
                </View>
                <View className="flex-row gap-3 mb-4">
                  <DashStat icon="cube" color="bg-amber-500" title="SP dang ban" value={String(Number(sellerDashboard?.activeProducts || 0))} />
                  <DashStat icon="line-chart" color="bg-violet-500" title="TB / don" value={formatPrice(avgOrder)} />
                </View>

                {/* Revenue chart */}
                <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
                  <Text className="font-bold text-slate-900 mb-1">Doanh thu theo thang</Text>
                  <Text className="text-xs text-slate-400 mb-4">Tong quan theo du lieu backend.</Text>

                  {revenueData.length === 0 ? (
                    <View className="rounded-xl border border-dashed border-slate-300 py-10 items-center">
                      <FontAwesome name="bar-chart" size={22} color="#CBD5E1" />
                      <Text className="text-slate-400 text-sm mt-2">Chua co du lieu doanh thu</Text>
                    </View>
                  ) : (
                    <View>
                      <View className="h-44 flex-row items-end justify-between border-b border-slate-100 pb-2">
                        {revenueData.map((point) => {
                          const revenueValue = Number(point.revenue || 0);
                          const heightPercent = peakRevenue > 0 ? Math.max(4, Math.round((revenueValue / peakRevenue) * 100)) : 4;
                          return (
                            <View key={`${point.month}-${revenueValue}`} className="items-center flex-1">
                              <View className="w-6 rounded-t-lg bg-emerald-500" style={{ height: `${heightPercent}%` }} />
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

                {/* Ranked lists */}
                <RankList
                  title="Ban chay nhat"
                  icon="arrow-up"
                  iconColor="#16A34A"
                  emptyText="Chua co du lieu."
                  items={bestSelling}
                />
                <RankList
                  title="Can cai thien (ban cham)"
                  icon="arrow-down"
                  iconColor="#EF4444"
                  emptyText="Chua co du lieu."
                  items={needImprovement}
                />
              </>
            )}
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
          onPressShop={(shopId) => router.push({ pathname: '/shop/[id]', params: { id: shopId } })}
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

// ── Seller dashboard sub-components (style giống StatCard web) ────────────────
function DashStat({
  icon,
  color,
  title,
  value,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  title: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-4">
      <View className={`w-10 h-10 rounded-full items-center justify-center ${color}`}>
        <FontAwesome name={icon} size={16} color="#FFFFFF" />
      </View>
      <Text className="text-slate-900 text-lg font-black mt-3" numberOfLines={1}>{value}</Text>
      <Text className="text-slate-400 text-xs mt-0.5">{title}</Text>
    </View>
  );
}

type RankItem = { id: string; name: string; sold: number; avgRating?: number | null };

function RankList({
  title,
  icon,
  iconColor,
  emptyText,
  items,
}: {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor: string;
  emptyText: string;
  items: RankItem[];
}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
      <View className="flex-row items-center mb-3">
        <FontAwesome name={icon} size={14} color={iconColor} />
        <Text className="font-bold text-slate-900 ml-2">{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text className="text-slate-400 text-xs">{emptyText}</Text>
      ) : (
        items.map((item, index) => (
          <View key={`${title}-${item.id}`} className="flex-row items-center py-2.5 border-b border-slate-50">
            <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center">
              <Text className="text-[11px] font-black text-slate-600">{index + 1}</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-slate-800" numberOfLines={1}>{item.name}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                Da ban: {Number(item.sold || 0)}
                {typeof item.avgRating === 'number' && item.avgRating > 0 ? `  ·  ★ ${item.avgRating}` : ''}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}