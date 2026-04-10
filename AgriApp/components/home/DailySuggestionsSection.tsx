import { ScrollView, View } from 'react-native';

import { Product } from '@/api/product';
import { HomeProductCard } from './HomeProductCard';
import { SectionHeader } from './SectionHeader';

type DailySuggestionsSectionProps = {
  products: Product[];
  onPressProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
};

export const DailySuggestionsSection = ({
  products,
  onPressProduct,
  onAddToCart,
}: DailySuggestionsSectionProps) => {
  const items = products.slice(0, 6);

  if (items.length === 0) return null;

  return (
    <View className="mb-5">
      <SectionHeader title="Goi y hom nay" subtitle="San pham duoc chon ngau nhien tu BE" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row gap-3">
          {items.map((item) => (
            <HomeProductCard
              key={item.id}
              product={item}
              onPress={() => onPressProduct(item.id)}
              onAddToCart={() => onAddToCart(item)}
              compact
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};