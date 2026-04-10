import { Text, TouchableOpacity, View } from 'react-native';

import { formatPrice } from '@/utils/format';

type CartFooterProps = {
  totalItems: number;
  totalPrice: number;
};

export const CartFooter = ({ totalItems, totalPrice }: CartFooterProps) => {
  return (
    <View className="border-t border-gray-200 px-4 py-3 bg-white">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-500">Tong ({totalItems} san pham)</Text>
        <Text className="text-lg font-bold text-green-700">{formatPrice(totalPrice)}</Text>
      </View>
      <TouchableOpacity className="bg-green-600 py-3 rounded-xl items-center">
        <Text className="text-white font-semibold">Tien hanh dat hang</Text>
      </TouchableOpacity>
    </View>
  );
};
