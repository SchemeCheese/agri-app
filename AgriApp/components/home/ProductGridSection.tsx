import { View } from 'react-native';

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
  if (products.length === 0) return null;

  return (
    <View className="mb-5">
      <SectionHeader title={title} subtitle={subtitle} />

      <View className="px-4">
        {products.map((item) => (
          <HomeProductCard
            key={item.id}
            product={item}
            onPress={() => onPressProduct(item.id)}
            onAddToCart={() => onAddToCart(item)}
          />
        ))}
      </View>
    </View>
  );
};