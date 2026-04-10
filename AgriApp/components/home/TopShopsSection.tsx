import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Product } from '@/api/product';
import { resolveImageUrl } from '@/utils/image';
import { SectionHeader } from './SectionHeader';

type ShopCard = {
  id: string;
  name: string;
  avatar?: string | null;
  productCount: number;
  rating: number;
};

const buildTopShops = (products: Product[]): ShopCard[] => {
  const groups = new Map<string, ShopCard>();

  products.forEach((product) => {
    const shopId = product.shop?.id ?? product.seller_id ?? product.id;
    const current = groups.get(shopId);
    const nextCount = (current?.productCount ?? 0) + 1;

    groups.set(shopId, {
      id: shopId,
      name: product.shop?.store_name ?? product.shopName ?? 'Agri Shop',
      avatar: product.shop?.avatar_url ?? null,
      productCount: nextCount,
      rating: product.rating ?? 5,
    });
  });

  return Array.from(groups.values())
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 4);
};

type TopShopsSectionProps = {
  products: Product[];
  onPressShop: (shopId: string) => void;
};

export const TopShopsSection = ({ products, onPressShop }: TopShopsSectionProps) => {
  const shops = buildTopShops(products);

  if (shops.length === 0) return null;

  return (
    <View className="mb-5">
      <SectionHeader title="Shop noi bat hang dau" subtitle="Nhung shop co nhieu san pham nhat" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row gap-3">
          {shops.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              onPress={() => onPressShop(shop.id)}
              className="w-44 bg-white border border-slate-100 rounded-[28px] p-4"
            >
              <View className="w-14 h-14 rounded-full bg-green-50 items-center justify-center overflow-hidden border border-green-100">
                {shop.avatar ? (
                  <Image source={{ uri: resolveImageUrl(shop.avatar) }} className="w-full h-full" />
                ) : (
                  <View className="w-full h-full bg-green-100" />
                )}
              </View>
              <Text className="mt-3 text-slate-900 font-bold" numberOfLines={1}>
                {shop.name}
              </Text>
              <Text className="text-xs text-slate-500 mt-1">
                {shop.productCount} san pham · ⭐ {Number(shop.rating).toFixed(1)}
              </Text>
              <View className="mt-3 self-start bg-green-50 px-3 py-1.5 rounded-full">
                <Text className="text-green-700 text-xs font-semibold">Xem shop</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};