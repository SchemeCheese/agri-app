import { Dimensions, ScrollView, View } from 'react-native';

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
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(Math.round(screenWidth * 0.72), 260);
  const cardGap = 12;

  if (items.length === 0) return null;

  return (
    <View className="mb-5">
      <SectionHeader title="Goi y hom nay" subtitle="San pham duoc chon ngau nhien tu BE" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={cardWidth + cardGap}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
      >
        <View className="flex-row gap-3">
          {items.map((item) => (
            <HomeProductCard
              key={item.id}
              product={item}
              onPress={() => onPressProduct(item.id)}
              onAddToCart={() => onAddToCart(item)}
              compact
              style={{ width: cardWidth }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};