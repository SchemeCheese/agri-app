import { FontAwesome } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Product } from '@/api/product';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

type CartItemRowProps = {
  product: Product;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export const CartItemRow = ({
  product,
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemRowProps) => {
  return (
    <View className="bg-white border border-gray-100 rounded-2xl p-3 mb-3 flex-row gap-3">
      <Image source={{ uri: resolveImageUrl(product.images?.[0]) }} className="w-20 h-20 rounded-xl" />

      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-800" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-green-700 font-bold mt-1">{formatPrice(product.price)}</Text>

        <View className="mt-2 flex-row justify-between items-center">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center" onPress={onDecrease}>
              <FontAwesome name="minus" size={10} color="#374151" />
            </TouchableOpacity>
            <Text className="font-semibold text-gray-700">{quantity}</Text>
            <TouchableOpacity className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center" onPress={onIncrease}>
              <FontAwesome name="plus" size={10} color="#374151" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onRemove}>
            <Text className="text-xs text-red-500 font-medium">Xoa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
