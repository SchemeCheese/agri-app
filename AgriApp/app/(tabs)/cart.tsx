import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, useCartSummary } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

type SellerOrder = {
  id: string;
  status: string;
  created_at: string;
  final_total_price: number;
  payment_method: string;
  shipping_address?: string;
  note?: string;
  buyer?: {
    id?: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  order_items: {
    id: string;
    quantity: number;
    negotiated_price: number;
    product?: {
      name?: string;
      images?: string[];
      unit?: string;
    };
  }[];
};

const SELLER_STATUS_FILTERS: Array<{ key: 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'ISSUE_REPORTED' | 'CANCELLED' | 'FAILED'; label: string }> = [
  { key: 'ALL', label: 'Tat ca' },
  { key: 'PENDING', label: 'Cho xac nhan' },
  { key: 'CONFIRMED', label: 'Cho van chuyen' },
  { key: 'SHIPPING', label: 'Dang giao' },
  { key: 'COMPLETED', label: 'Da giao' },
  { key: 'ISSUE_REPORTED', label: 'Co su co' },
  { key: 'CANCELLED', label: 'Da huy' },
  { key: 'FAILED', label: 'That lac' },
];

const getStatusText = (status: string) => {
  if (status === 'PENDING') return 'Cho xac nhan';
  if (status === 'CONFIRMED') return 'Cho van chuyen';
  if (status === 'SHIPPING') return 'Dang giao';
  if (status === 'COMPLETED') return 'Da giao';
  if (status === 'ISSUE_REPORTED') return 'Co su co';
  if (status === 'CANCELLED') return 'Da huy';
  if (status === 'FAILED') return 'That lac';
  return status;
};

const getPaymentMethodText = (method: string) => {
  if (method === 'COD') return 'Thanh toan khi nhan hang (COD)';
  if (method === 'ONLINE') return 'Thanh toan online';
  if (method === 'BANK_TRANSFER') return 'Chuyen khoan ngan hang';
  return method || 'Khong xac dinh';
};

export default function CartScreen() {
  const router = useRouter();
  const { cartItems } = useCartSummary();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSeller = user?.role === 'SELLER';

  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [loadingSellerOrders, setLoadingSellerOrders] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [selectedSellerStatus, setSelectedSellerStatus] = useState<(typeof SELLER_STATUS_FILTERS)[number]['key']>('ALL');
  const [selectedSellerOrder, setSelectedSellerOrder] = useState<SellerOrder | null>(null);
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

  const fetchSellerOrders = async () => {
    if (!accessToken || !isSeller) return;

    setLoadingSellerOrders(true);
    try {
      const res = await api.get<SellerOrder[]>('/orders/seller-orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSellerOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSellerOrders([]);
    } finally {
      setLoadingSellerOrders(false);
    }
  };

  const handleSellerAction = async (orderId: string, action: 'confirm' | 'ship' | 'confirm-lost' | 'cancel') => {
    if (!accessToken) return;
    setProcessingOrderId(orderId);
    try {
      const path =
        action === 'confirm'
          ? `/orders/${orderId}/confirm`
          : action === 'ship'
            ? `/orders/${orderId}/ship`
            : action === 'confirm-lost'
              ? `/orders/${orderId}/confirm-lost`
              : `/orders/${orderId}/cancel`;

      await api.patch(path, action === 'cancel' ? { reason: 'Nguoi ban huy don' } : {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchSellerOrders();
    } catch {
      // no-op
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleConfirmSellerAction = (orderId: string, action: 'confirm' | 'ship' | 'confirm-lost' | 'cancel') => {
    const actionLabel =
      action === 'confirm'
        ? 'xac nhan don hang'
        : action === 'ship'
          ? 'gui hang'
          : action === 'confirm-lost'
            ? 'xac nhan that lac'
            : 'huy don hang';

    Alert.alert('Xac nhan thao tac', `Ban co chac chan muon ${actionLabel} nay?`, [
      { text: 'Khong', style: 'cancel' },
      {
        text: 'Dong y',
        style: action === 'cancel' ? 'destructive' : 'default',
        onPress: () => {
          void handleSellerAction(orderId, action);
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isSeller) return;
      void fetchSellerOrders();
    }, [isSeller, accessToken]),
  );

  const sellerOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: sellerOrders.length,
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPING: 0,
      COMPLETED: 0,
      ISSUE_REPORTED: 0,
      CANCELLED: 0,
      FAILED: 0,
    };

    sellerOrders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
    });

    return counts;
  }, [sellerOrders]);

  const filteredSellerOrders = useMemo(() => {
    if (selectedSellerStatus === 'ALL') return sellerOrders;
    return sellerOrders.filter((order) => order.status === selectedSellerStatus);
  }, [sellerOrders, selectedSellerStatus]);

  const getStatusPillClasses = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (status === 'SHIPPING') return 'bg-violet-50 border-violet-200 text-violet-700';
    if (status === 'CONFIRMED') return 'bg-blue-50 border-blue-200 text-blue-700';
    if (status === 'PENDING') return 'bg-amber-50 border-amber-200 text-amber-700';
    if (status === 'ISSUE_REPORTED') return 'bg-orange-50 border-orange-200 text-orange-700';
    if (status === 'FAILED') return 'bg-rose-50 border-rose-200 text-rose-700';
    if (status === 'CANCELLED') return 'bg-slate-100 border-slate-200 text-slate-600';
    return 'bg-slate-100 border-slate-200 text-slate-600';
  };

  if (isSeller) {
    return (
      <ScreenContainer>
        <View className="px-4 py-3 border-b border-slate-100 bg-white">
          <Text className="text-2xl font-bold text-slate-900">Don hang</Text>
          <Text className="text-sm text-slate-500 mt-1">Quan ly va xu ly don hang cua shop</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 bg-white border-b border-slate-100"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {SELLER_STATUS_FILTERS.map((item) => {
            const active = selectedSellerStatus === item.key;
            const count = sellerOrderCounts[item.key] || 0;

            return (
              <TouchableOpacity
                key={item.key}
                className={`mr-2 rounded-2xl px-4 py-2 flex-row items-center border ${active ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-50 border-slate-200'}`}
                onPress={() => setSelectedSellerStatus(item.key)}
              >
                <Text className={`font-bold ${active ? 'text-white' : 'text-slate-700'}`}>{item.label}</Text>
                <View className={`ml-2 rounded-full px-2 py-0.5 ${active ? 'bg-white/20' : 'bg-slate-200'}`}>
                  <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-700'}`}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
          {loadingSellerOrders ? (
            <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : null}

          {!loadingSellerOrders && filteredSellerOrders.length === 0 ? (
            <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
              <EmptyState title="Chua co don hang nao" description="Khi khach dat mua, don hang se xuat hien tai day." />
            </View>
          ) : null}

          {!loadingSellerOrders
            ? filteredSellerOrders.map((order) => {
                const firstItem = order.order_items[0];
                const moreCount = Math.max(order.order_items.length - 1, 0);

                return (
                <View key={order.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-black text-white bg-[#0F172A] px-2 py-1 rounded-md">#{order.id.slice(-8).toUpperCase()}</Text>
                    <View className={`border rounded-full px-3 py-1 ${getStatusPillClasses(order.status)}`}>
                      <Text className="text-xs font-bold">{getStatusText(order.status)}</Text>
                    </View>
                  </View>

                  <Text className="text-sm font-semibold text-slate-800 mt-2">{order.buyer?.full_name || 'Khach hang'}</Text>
                  <Text className="text-xs text-slate-400 mt-1">{order.buyer?.email || 'Khong co email'} | {new Date(order.created_at).toLocaleDateString('vi-VN')}</Text>

                  <View className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 flex-row">
                    <Image source={{ uri: resolveImageUrl(firstItem?.product?.images?.[0]) }} className="w-14 h-14 rounded-lg" />
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-800 font-bold" numberOfLines={1}>{firstItem?.product?.name || 'San pham khong xac dinh'}</Text>
                      <Text className="text-xs text-slate-500 mt-1">So luong: {Number(firstItem?.quantity || 0)}{moreCount > 0 ? ` (+${moreCount} mon)` : ''}</Text>
                      <Text className="text-xs text-slate-500 mt-1">Thanh toan: {getPaymentMethodText(order.payment_method)}</Text>
                    </View>
                  </View>

                  <Text className="text-[#16A34A] font-black text-2xl mt-2">{formatPrice(Number(order.final_total_price || 0))}</Text>

                  <View className="mt-3 flex-row gap-2">
                    {order.status === 'PENDING' ? (
                      <>
                        <TouchableOpacity className={`flex-1 rounded-xl py-2.5 items-center ${processingOrderId === order.id ? 'bg-slate-300' : 'bg-blue-600'}`} onPress={() => handleConfirmSellerAction(order.id, 'confirm')} disabled={processingOrderId === order.id}>
                          <Text className="text-white font-bold">Xac nhan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className={`flex-1 rounded-xl py-2.5 items-center border ${processingOrderId === order.id ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-200'}`} onPress={() => handleConfirmSellerAction(order.id, 'cancel')} disabled={processingOrderId === order.id}>
                          <Text className={`font-bold ${processingOrderId === order.id ? 'text-slate-500' : 'text-red-600'}`}>Huy</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}

                    {order.status === 'CONFIRMED' ? (
                      <>
                        <TouchableOpacity className={`flex-1 rounded-xl py-2.5 items-center ${processingOrderId === order.id ? 'bg-slate-300' : 'bg-emerald-600'}`} onPress={() => handleConfirmSellerAction(order.id, 'ship')} disabled={processingOrderId === order.id}>
                          <Text className="text-white font-bold">Gui hang</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className={`flex-1 rounded-xl py-2.5 items-center border ${processingOrderId === order.id ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-200'}`} onPress={() => handleConfirmSellerAction(order.id, 'cancel')} disabled={processingOrderId === order.id}>
                          <Text className={`font-bold ${processingOrderId === order.id ? 'text-slate-500' : 'text-red-600'}`}>Huy</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}

                    {order.status === 'ISSUE_REPORTED' ? (
                      <TouchableOpacity className={`flex-1 rounded-xl py-2.5 items-center ${processingOrderId === order.id ? 'bg-slate-300' : 'bg-orange-500'}`} onPress={() => handleConfirmSellerAction(order.id, 'confirm-lost')} disabled={processingOrderId === order.id}>
                        <Text className="text-white font-bold">Xac nhan that lac</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      className="rounded-xl py-2.5 px-3 items-center bg-slate-700"
                      onPress={() => setSelectedSellerOrder(order)}
                    >
                      <Text className="text-white font-bold">Chi tiet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                );
              })
            : null}
        </ScrollView>

        <Modal
          visible={Boolean(selectedSellerOrder)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSellerOrder(null)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/45 justify-end"
            activeOpacity={1}
            onPress={() => setSelectedSellerOrder(null)}
          >
            <TouchableOpacity className="bg-white rounded-t-3xl p-4 pb-8 max-h-[85%]" activeOpacity={1} onPress={() => {}}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-black text-slate-900">Chi tiet don hang</Text>
                <TouchableOpacity onPress={() => setSelectedSellerOrder(null)}>
                  <FontAwesome name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {selectedSellerOrder ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
                    <Text className="text-xs text-slate-500">Ma don</Text>
                    <Text className="font-black text-slate-900 mt-1">#{selectedSellerOrder.id.slice(-8).toUpperCase()}</Text>
                    <Text className="text-xs text-slate-500 mt-2">Trang thai: <Text className="font-bold text-slate-700">{getStatusText(selectedSellerOrder.status)}</Text></Text>
                    <Text className="text-xs text-slate-500 mt-1">Thanh toan: <Text className="font-bold text-slate-700">{getPaymentMethodText(selectedSellerOrder.payment_method)}</Text></Text>
                    <Text className="text-xs text-slate-500 mt-1">Ngay tao: <Text className="font-bold text-slate-700">{new Date(selectedSellerOrder.created_at).toLocaleString('vi-VN')}</Text></Text>
                  </View>

                  <View className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
                    <Text className="font-bold text-slate-900">Thong tin nguoi mua</Text>
                    <Text className="text-sm text-slate-700 mt-2">Ho ten: {selectedSellerOrder.buyer?.full_name || 'Khach hang'}</Text>
                    <Text className="text-sm text-slate-700 mt-1">Email: {selectedSellerOrder.buyer?.email || 'Khong co'}</Text>
                    <Text className="text-sm text-slate-700 mt-1">So dien thoai: {selectedSellerOrder.buyer?.phone_number || 'Khong co'}</Text>
                    <Text className="text-sm text-slate-700 mt-1">Dia chi giao: {selectedSellerOrder.shipping_address || 'Khong co'}</Text>
                    <Text className="text-sm text-slate-700 mt-1">Ghi chu: {selectedSellerOrder.note || 'Khong co'}</Text>
                  </View>

                  <View className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
                    <Text className="font-bold text-slate-900 mb-2">San pham da mua</Text>
                    {selectedSellerOrder.order_items.map((item) => (
                      <View key={item.id} className="bg-white rounded-lg border border-slate-100 p-2 mb-2 flex-row">
                        <Image source={{ uri: resolveImageUrl(item.product?.images?.[0]) }} className="w-12 h-12 rounded-md" />
                        <View className="ml-2 flex-1">
                          <Text className="font-semibold text-slate-800" numberOfLines={1}>{item.product?.name || 'San pham'}</Text>
                          <Text className="text-xs text-slate-500 mt-1">So luong: {Number(item.quantity || 0)} {item.product?.unit || ''}</Text>
                          <Text className="text-xs text-slate-500 mt-1">Don gia: {formatPrice(Number(item.negotiated_price || 0))}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <Text className="text-xs text-emerald-700">Tong tien don</Text>
                    <Text className="text-2xl font-black text-emerald-700 mt-1">{formatPrice(Number(selectedSellerOrder.final_total_price || 0))}</Text>
                  </View>
                </ScrollView>
              ) : null}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScreenContainer>
    );
  }

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
