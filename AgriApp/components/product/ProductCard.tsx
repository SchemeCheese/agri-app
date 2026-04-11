import { FontAwesome } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Product } from '@/api/product';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

type ProductCardProps = {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
};

export const ProductCard = ({ product, onPress, onAddToCart }: ProductCardProps) => {
  const shopName = product.shop?.store_name ?? product.shopName ?? 'Agri Shop';
  const isPaused = product.is_active === false;

  return (
    <TouchableOpacity
      className="w-[48%] bg-white rounded-[28px] mb-4 border border-slate-100 overflow-hidden shadow-sm shadow-slate-200/50"
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isPaused}
    >
      <View className="relative">
        <Image source={{ uri: resolveImageUrl(product.images?.[0]) }} className="w-full h-40" />
        {isPaused ? (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <View className="bg-red-600 px-3 py-1.5 rounded-full">
              <Text className="text-white text-[11px] font-extrabold uppercase">Tam dung ban</Text>
            </View>
          </View>
        ) : null}
        <View className="absolute top-3 left-3 bg-black/45 px-2.5 py-1 rounded-full">
          <Text className="text-white text-[10px] font-semibold">{shopName}</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-[11px] text-gray-500 mt-1" numberOfLines={1}>
          {product.origin ?? 'Viet Nam'}
        </Text>

        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-green-700 font-bold text-base">{formatPrice(product.price)}</Text>
            <Text className="text-gray-400 text-[10px]">/{product.unit ?? 'kg'}</Text>
          </View>

          <TouchableOpacity
            className={`w-9 h-9 rounded-full items-center justify-center ${isPaused ? 'bg-slate-200' : 'bg-green-100'}`}
            onPress={onAddToCart}
            disabled={isPaused}
          >
            <FontAwesome name="plus" size={12} color={isPaused ? '#94A3B8' : '#15803d'} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
