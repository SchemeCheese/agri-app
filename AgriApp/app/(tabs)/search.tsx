import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, ImageBackground, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SearchInput } from '@/components/common/SearchInput';
import { SectionHeader } from '@/components/home/SectionHeader';
import { HomeFooterCard } from '@/components/home/HomeFooterCard';
import { CategoryChips } from '@/components/product/CategoryChips';
import { ProductFilters } from '@/components/product/ProductFilters';
import { ProductCard } from '@/components/product/ProductCard';
import { useProductSearch, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';

const MIN_PRICE = 0;
const MAX_PRICE = 2000000;
const ORIGIN_OPTIONS = ['Đà Lạt', 'Tây Bắc', 'Miền Tây', 'Nhập khẩu'];

export default function SearchScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);

  const { products, categories, isLoading, isError } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const filteredProducts = useProductSearch(products, keyword, selectedCategory);

  const normalizeText = (value?: string) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const visibleProducts = useMemo(() => {
    return filteredProducts.filter((product) => {
      const price = product.price ?? 0;
      const matchPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchOrigin =
        selectedOrigins.length === 0 ||
        selectedOrigins.some((origin) => normalizeText(product.origin).includes(normalizeText(origin)));

      return matchPrice && matchOrigin;
    });
  }, [filteredProducts, priceRange, selectedOrigins]);

  const handleToggleOrigin = (origin: string) => {
    setSelectedOrigins((current) =>
      current.includes(origin) ? current.filter((item) => item !== origin) : [...current, origin],
    );
  };

  const clearFilterOnly = () => {
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSelectedOrigins([]);
  };

  const ProductHeader = () => (
    <View className="pb-4">
      <View className="px-4 pt-3">
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1400&auto=format&fit=crop' }}
          className="rounded-[32px] overflow-hidden"
          imageStyle={{ borderRadius: 32 }}
        >
          <View className="bg-black/35 min-h-[190px] px-5 py-5 justify-end">
            <View className="bg-white/15 self-start px-3 py-1.5 rounded-full border border-white/20">
              <Text className="text-white text-[11px] font-semibold tracking-wide">Danh muc san pham</Text>
            </View>

            <Text className="text-white text-3xl font-extrabold leading-tight mt-4">
              Tim nong san theo{`\n`}danh muc va bo loc
            </Text>

            <Text className="text-white/85 mt-3 text-sm leading-5 max-w-[290px]">
              Xem toan bo san pham tu backend, loc nhanh theo gia, xuat xu va nhom san pham.
            </Text>
          </View>
        </ImageBackground>
      </View>

      <View className="px-4 mt-4">
        <SearchInput value={keyword} onChangeText={setKeyword} placeholder="Nhap ten san pham..." />
      </View>

      <View className="mb-1 mt-5">
        <SectionHeader title="Danh muc" subtitle="Chon nhanh nhom san pham" />
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </View>

      <ProductFilters
        minPrice={MIN_PRICE}
        maxPrice={MAX_PRICE}
        priceRange={priceRange}
        onChangePriceRange={setPriceRange}
        origins={ORIGIN_OPTIONS}
        selectedOrigins={selectedOrigins}
        onToggleOrigin={handleToggleOrigin}
        onClearAll={clearFilterOnly}
      />

      <View className="px-4 mt-4">
        <Text className="text-base text-slate-600">
          Tìm thấy <Text className="font-bold text-[#15803D]">{visibleProducts.length}</Text> sản phẩm
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        ListHeaderComponent={<ProductHeader />}
        ListFooterComponent={<HomeFooterCard />}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : isError ? (
            <EmptyState
              title="Khong tai duoc danh sach san pham"
              description="Kiem tra EXPO_PUBLIC_API_URL va backend NestJS dang chay tren Railway."
            />
          ) : (
            <EmptyState
              title="Khong co san pham phu hop"
              description="Thu doi khoang gia, nguon goc hoac danh muc khac."
            />
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              router.push({
                pathname: '/product/[id]',
                params: { id: item.id },
              })
            }
            onAddToCart={() => addItem(item)}
          />
        )}
      />
    </ScreenContainer>
  );
}
