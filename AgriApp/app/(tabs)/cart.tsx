import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, useCartSummary } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

export default function CartScreen() {
  const router = useRouter();
  const { cartItems } = useCartSummary();
  const user = useAuthStore((state) => state.user);

  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const cartIdKey = useMemo(
    () => cartItems.map((item) => item.product.id).sort().join('|'),
    [cartItems],
  );

  useEffect(() => {
    const allIds = cartIdKey ? cartIdKey.split('|') : [];

    setSelectedIds((prev) => {
      const active = prev.filter((id) => allIds.includes(id));
      const target = active.length > 0 ? active : allIds;

      const unchanged =
        target.length === prev.length &&
        target.every((id, index) => id === prev[index]);

      if (unchanged) return prev;
      return target;
    });
  }, [cartIdKey]);

  const groupedByShop = useMemo(() => {
    return cartItems.reduce<Record<string, typeof cartItems>>((acc, item) => {
      const shopId = item.product.shop?.id ?? item.product.seller_id ?? 'unknown-shop';
      if (!acc[shopId]) acc[shopId] = [];
      acc[shopId].push(item);
      return acc;
    }, {});
  }, [cartItems]);

  const selectedItems = cartItems.filter((item) => selectedIds.includes(item.product.id));
  const selectedTotal = selectedItems.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
    0,
  );
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const toggleItem = (productId: string) => {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(cartItems.map((item) => item.product.id));
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) return;

    const ids = selectedIds.join(',');
    if (!user) {
      router.push({ pathname: '/auth/login', params: { returnTo: '/checkout', ids } });
      return;
    }

    router.push({ pathname: '/checkout', params: { ids } });
  };

  return (
    <ScreenContainer>
      <View className="px-4 py-3 border-b border-slate-100 bg-white">
        <Text className="text-2xl font-bold text-slate-900">Gio hang</Text>
        <Text className="text-sm text-slate-500 mt-1">Ban co {cartItems.length} san pham trong gio.</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
        {cartItems.length > 0 ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-3 mb-3 flex-row items-center justify-between">
            <TouchableOpacity className="flex-row items-center" onPress={toggleSelectAll}>
              <FontAwesome
                name={allSelected ? 'check-square-o' : 'square-o'}
                size={20}
                color={allSelected ? '#16A34A' : '#64748B'}
              />
              <Text className="ml-3 text-slate-700 font-semibold">Chon tat ca ({cartItems.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={clearCart}>
              <Text className="text-red-500 font-semibold">Xoa tat ca</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {Object.entries(groupedByShop).map(([shopId, items]) => {
          const shopName = items[0]?.product.shop?.store_name ?? `Shop #${shopId.slice(-6)}`;
          const allShopSelected = items.every((item) => selectedIds.includes(item.product.id));

          return (
            <View key={shopId} className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3">
              <View className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex-row items-center">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => {
                    if (allShopSelected) {
                      setSelectedIds((prev) => prev.filter((id) => !items.find((x) => x.product.id === id)));
                      return;
                    }
                    setSelectedIds((prev) => [...new Set([...prev, ...items.map((x) => x.product.id)])]);
                  }}
                >
                  <FontAwesome
                    name={allShopSelected ? 'check-square-o' : 'square-o'}
                    size={18}
                    color={allShopSelected ? '#16A34A' : '#64748B'}
                  />
                  <Text className="ml-2 font-bold text-slate-800">{shopName}</Text>
                </TouchableOpacity>
              </View>

              {items.map((item) => (
                <View key={item.product.id} className="px-3 py-3 border-b border-slate-50 flex-row gap-3">
                  <TouchableOpacity onPress={() => toggleItem(item.product.id)} className="pt-1">
                    <FontAwesome
                      name={selectedIds.includes(item.product.id) ? 'check-square-o' : 'square-o'}
                      size={20}
                      color={selectedIds.includes(item.product.id) ? '#16A34A' : '#64748B'}
                    />
                  </TouchableOpacity>

                  <Image source={{ uri: resolveImageUrl(item.product.images?.[0]) }} className="w-20 h-20 rounded-xl" />

                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800" numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1">{item.product.unit ?? 'kg'}</Text>
                    <Text className="text-[#15803D] font-bold mt-1">{formatPrice(item.product.price)}</Text>

                    <View className="flex-row items-center justify-between mt-2">
                      <View className="flex-row items-center border border-slate-200 rounded-lg overflow-hidden">
                        <TouchableOpacity className="px-3 py-1.5 bg-slate-50" onPress={() => decreaseItem(item.product.id)}>
                          <FontAwesome name="minus" size={12} color="#374151" />
                        </TouchableOpacity>
                        <Text className="px-3 font-semibold text-slate-800">{item.quantity}</Text>
                        <TouchableOpacity className="px-3 py-1.5 bg-slate-50" onPress={() => increaseItem(item.product.id)}>
                          <FontAwesome name="plus" size={12} color="#374151" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          removeItem(item.product.id);
                          setSelectedIds((prev) => prev.filter((id) => id !== item.product.id));
                        }}
                      >
                        <Text className="text-red-500 font-semibold text-xs">Xoa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {cartItems.length === 0 ? (
          <EmptyState
            title="Gio hang dang trong"
            description="Chon san pham o Trang chu hoac Tim kiem de them vao gio."
          />
        ) : null}
      </ScrollView>

      {cartItems.length > 0 ? (
        <View className="border-t border-gray-200 px-4 py-3 bg-white">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-500">Tam tinh ({selectedQuantity} san pham)</Text>
            <Text className="text-lg font-bold text-green-700">{formatPrice(selectedTotal)}</Text>
          </View>
          <TouchableOpacity
            className={`py-3 rounded-xl items-center ${selectedIds.length > 0 ? 'bg-green-600' : 'bg-slate-300'}`}
            onPress={handleCheckout}
            disabled={selectedIds.length === 0}
          >
            <Text className="text-white font-semibold">
              {selectedIds.length > 0 ? `Thanh toan (${selectedIds.length})` : 'Chon san pham de mua'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
