import { FontAwesome } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Product } from '@/api/product';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

type HomeProductCardProps = {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const HomeProductCard = ({ product, onPress, onAddToCart, compact = false, style }: HomeProductCardProps) => {
  const widthClass = compact ? '' : 'w-full';
  const isPaused = product.is_active === false;

  return (
    <TouchableOpacity
      className={`${widthClass} bg-white rounded-[24px] mb-4 border border-slate-100 overflow-hidden shadow-sm shadow-slate-200/50`}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isPaused}
      style={style}
    >
      <View className="relative">
        <Image source={{ uri: resolveImageUrl(product.images?.[0]) }} className={compact ? 'w-full h-32' : 'w-full h-48'} />
        {isPaused ? (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <View className="bg-red-600 px-3 py-1.5 rounded-full">
              <Text className="text-white text-[11px] font-extrabold uppercase">Tam dung ban</Text>
            </View>
          </View>
        ) : null}
        <View className="absolute top-3 left-3 bg-black/50 px-2.5 py-1 rounded-full">
          <Text className="text-white text-[10px] font-semibold" numberOfLines={1}>
            {product.shop?.store_name ?? product.shopName ?? 'Agri Shop'}
          </Text>
        </View>
      </View>

      <View className={compact ? 'p-3' : 'p-4'}>
        <Text className="text-base font-bold text-slate-900" numberOfLines={compact ? 2 : 1}>
          {product.name}
        </Text>
        <Text className="text-[12px] text-slate-500 mt-1" numberOfLines={1}>
          {product.origin ?? 'Viet Nam'}
        </Text>

        <View className="mt-3 flex-row items-end justify-between">
          <View>
            <Text className="text-[#15803D] font-extrabold text-[16px]">{formatPrice(product.price)}</Text>
            <Text className="text-slate-400 text-[11px]">/{product.unit ?? 'kg'}</Text>
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