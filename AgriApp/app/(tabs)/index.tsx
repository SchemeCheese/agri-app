import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

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

export default function HomeScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const { products, categories, isLoading, isError } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const { totalItems } = useCartSummary();

  const filteredProducts = useProductSearch(products, keyword, selectedCategory);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <HomeHero
          cartCount={totalItems}
          onPressCart={() => router.push('/(tabs)/cart')}
          keyword={keyword}
          onChangeKeyword={setKeyword}
          onPressExplore={() => router.push('/(tabs)/search')}
          onPressSearch={() => router.push('/(tabs)/search')}
        />

        <TopSearches onPressKeyword={setKeyword} />

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
            onPressProduct={(productId) =>
              router.push({ pathname: '/product/[id]', params: { id: productId } })
            }
            onAddToCart={(item) => addItem(item)}
          />
        ) : null}

        <TopShopsSection
          products={products}
          onPressShop={() => router.push('/(tabs)/search')}
        />

        <PromoSection />

        <DailySuggestionsSection
          products={products}
          onPressProduct={(productId) =>
            router.push({ pathname: '/product/[id]', params: { id: productId } })
          }
          onAddToCart={(item) => addItem(item)}
        />

        <GallerySection />
        <HomeFooterCard />
      </ScrollView>
    </ScreenContainer>
  );
}