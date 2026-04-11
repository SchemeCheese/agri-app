import { Dimensions, ScrollView, View } from 'react-native';

import { Product } from '@/api/product';
import { HomeProductCard } from './HomeProductCard';
import { SectionHeader } from './SectionHeader';

type ProductGridSectionProps = {
  title: string;
  subtitle?: string;
  products: Product[];
  onPressProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
};

export const ProductGridSection = ({
  title,
  subtitle,
  products,
  onPressProduct,
  onAddToCart,
}: ProductGridSectionProps) => {
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(Math.round(screenWidth * 0.72), 260);
  const cardGap = 12;

  if (products.length === 0) return null;

  return (
    <View className="mb-5">
      <SectionHeader title={title} subtitle={subtitle} />

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
          {products.map((item) => (
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