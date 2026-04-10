import { Text, View } from 'react-native';

import { Product } from '@/api/product';
import { formatUnitPrice } from '@/utils/format';

type ProductSummaryProps = {
  product: Product;
};

export const ProductSummary = ({ product }: ProductSummaryProps) => {
  return (
    <View className="bg-white rounded-[28px] border border-slate-100 p-4 shadow-sm shadow-slate-200/60">
      <Text className="text-2xl font-bold text-slate-900">{product.name}</Text>
      <Text className="text-sm text-slate-500 mt-2" numberOfLines={2}>
        {product.description || 'San pham dang duoc cap nhat mo ta.'}
      </Text>

      <View className="mt-4 flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] uppercase tracking-[2px] text-slate-400">Gia ban</Text>
          <Text className="text-[#15803D] text-2xl font-extrabold mt-1">{formatUnitPrice(product.price, product.unit)}</Text>
        </View>
        <Text className="text-xs text-slate-500">Ton kho: {product.stock ?? 0}</Text>
      </View>
    </View>
  );
};