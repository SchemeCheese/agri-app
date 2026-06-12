import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import api from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { OrderPreviewModal, type OrderPreviewGroup } from '@/components/order/OrderPreviewModal';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, useCartSummary } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

type PaymentMethod = 'COD' | 'MOMO';

/** Dòng sản phẩm đã chuẩn hoá — dùng chung cho cả checkout giỏ hàng lẫn checkout từ báo giá. */
type CheckoutLineItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  image?: string;
  shopId: string;
  shopName: string;
};

type ShopVoucherState = {
  inputCode: string;
  code: string;
  discountAmount: number;
  loading: boolean;
  error: string;
};

type SavedVoucher = {
  voucher?: {
    id: string;
    code: string;
    seller_id: string;
  };
};

const getDefaultVoucherState = (): ShopVoucherState => ({
  inputCode: '',
  code: '',
  discountAmount: 0,
  loading: false,
  error: '',
});

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    ids?: string;
    // ── Tham số chế độ báo giá (điều hướng từ chat khi buyer chấp nhận báo giá) ──
    quoteId?: string;
    productId?: string;
    productName?: string;
    quantity?: string;
    negotiatedPrice?: string;
    unit?: string;
    sellerId?: string;
    sellerName?: string;
    image?: string;
  }>();
  const ids = params.ids?.split(',').filter(Boolean) ?? [];

  // Chế độ báo giá: đặt hàng cho 1 món đã thương lượng giá (gọi /orders/checkout-quote).
  const isQuoteMode = Boolean(params.quoteId);

  const { cartItems } = useCartSummary();
  const removeItems = useCartStore((state) => state.removeItems);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [savedVouchers, setSavedVouchers] = useState<SavedVoucher[]>([]);
  const [voucherByShop, setVoucherByShop] = useState<Record<string, ShopVoucherState>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '');
    }
  }, [user]);

  useEffect(() => {
    // Voucher chỉ áp dụng cho checkout giỏ hàng. Báo giá đã chốt giá nên bỏ qua.
    if (isQuoteMode || !user || !accessToken || user.role !== 'BUYER') return;

    api
      .get<SavedVoucher[]>('/vouchers/saved', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => setSavedVouchers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSavedVouchers([]));
  }, [accessToken, user, isQuoteMode]);

  // ── Danh sách dòng hàng đã chuẩn hoá ──────────────────────────────────────
  const lineItems: CheckoutLineItem[] = useMemo(() => {
    if (isQuoteMode) {
      return [
        {
          productId: params.productId ?? '',
          name: params.productName ?? 'San pham',
          quantity: Number(params.quantity ?? 0),
          price: Number(params.negotiatedPrice ?? 0),
          unit: params.unit ?? 'kg',
          image: params.image || undefined,
          shopId: params.sellerId || 'unknown',
          shopName: params.sellerName?.trim() || 'Gian hang chua cap nhat',
        },
      ];
    }

    return cartItems
      .filter((item) => ids.includes(item.product.id))
      .map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price ?? 0,
        unit: item.product.unit ?? 'kg',
        image: item.product.images?.[0],
        shopId: item.product.shop?.id || item.product.seller_id || 'unknown',
        shopName: item.product.shop?.store_name?.trim() || 'Gian hang chua cap nhat',
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuoteMode, params.productId, params.productName, params.quantity, params.negotiatedPrice, params.unit, params.image, params.sellerId, params.sellerName, cartItems, ids.join(',')]);

  const shopGroups = useMemo(() => {
    return lineItems.reduce<Record<string, CheckoutLineItem[]>>((acc, item) => {
      if (!acc[item.shopId]) acc[item.shopId] = [];
      acc[item.shopId].push(item);
      return acc;
    }, {});
  }, [lineItems]);

  const subtotalByShop = useMemo(() => {
    return Object.fromEntries(
      Object.entries(shopGroups).map(([shopId, items]) => [
        shopId,
        items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      ]),
    ) as Record<string, number>;
  }, [shopGroups]);

  const totalPrice = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalDiscount = isQuoteMode
    ? 0
    : Object.entries(voucherByShop).reduce((sum, [, state]) => sum + (state.discountAmount ?? 0), 0);

  const finalTotal = Math.max(0, totalPrice - totalDiscount);

  const previewGroups: OrderPreviewGroup[] = useMemo(() => {
    return Object.entries(shopGroups).map(([shopId, items]) => {
      const subtotal = subtotalByShop[shopId] ?? 0;
      const discount = voucherByShop[shopId]?.discountAmount ?? 0;
      const shopName = items[0]?.shopName?.trim() || 'Gian hang chua cap nhat';

      return {
        seller_id: shopId,
        seller_name: shopName,
        items: items.map((item) => ({
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          shop_name: shopName,
          image: item.image,
        })),
        subtotal,
        discount,
        total: Math.max(0, subtotal - discount),
      };
    });
  }, [shopGroups, subtotalByShop, voucherByShop]);

  const updateVoucherState = (shopId: string, updater: (prev: ShopVoucherState) => ShopVoucherState) => {
    setVoucherByShop((prev) => {
      const current = prev[shopId] ?? getDefaultVoucherState();
      return {
        ...prev,
        [shopId]: updater(current),
      };
    });
  };

  const applyVoucher = async (shopId: string) => {
    if (!user || !accessToken) {
      router.replace({ pathname: '/auth/login', params: { returnTo: '/checkout', ids: ids.join(',') } });
      return;
    }

    const current = voucherByShop[shopId] ?? getDefaultVoucherState();
    const code = current.inputCode.trim().toUpperCase();
    if (!code) return;

    updateVoucherState(shopId, (prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await api.post(
        '/vouchers/validate',
        {
          code,
          seller_id: shopId,
          order_total: subtotalByShop[shopId] ?? 0,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      updateVoucherState(shopId, (prev) => ({
        ...prev,
        loading: false,
        code,
        inputCode: code,
        discountAmount: response.data?.discount_amount ?? 0,
        error: '',
      }));
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Ma khong hop le hoac da het han.';
      updateVoucherState(shopId, (prev) => ({
        ...prev,
        loading: false,
        error: Array.isArray(message) ? message.join(', ') : String(message),
        code: '',
        discountAmount: 0,
      }));
    }
  };

  const applySavedVoucher = async (shopId: string, code: string) => {
    if (!user || !accessToken) {
      router.replace({ pathname: '/auth/login', params: { returnTo: '/checkout', ids: ids.join(',') } });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    updateVoucherState(shopId, (prev) => ({ ...prev, loading: true, error: '', inputCode: normalizedCode }));

    try {
      const response = await api.post(
        '/vouchers/validate',
        {
          code: normalizedCode,
          seller_id: shopId,
          order_total: subtotalByShop[shopId] ?? 0,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      updateVoucherState(shopId, (prev) => ({
        ...prev,
        loading: false,
        code: normalizedCode,
        inputCode: normalizedCode,
        discountAmount: response.data?.discount_amount ?? 0,
        error: '',
      }));
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Ma khong hop le hoac da het han.';
      updateVoucherState(shopId, (prev) => ({
        ...prev,
        loading: false,
        error: Array.isArray(message) ? message.join(', ') : String(message),
        code: '',
        discountAmount: 0,
      }));
    }
  };

  const removeVoucher = (shopId: string) => {
    setVoucherByShop((prev) => ({
      ...prev,
      [shopId]: getDefaultVoucherState(),
    }));
  };

  // Checkout YÊU CẦU activeRole = BUYER. Nếu đang ở workspace SELLER nhưng tài khoản
  // SỞ HỮU vai trò BUYER → tự gọi /auth/switch-role để BE phát token BUYER mới (cập
  // nhật store). Không sở hữu BUYER → báo lỗi thân thiện. KHÔNG chỉ đổi route.
  const ensureBuyerRole = async (): Promise<boolean> => {
    if (!user) return false;
    if (user.role === 'BUYER') return true;
    if (!user.is_buyer) {
      Alert.alert('Thong bao', 'Tài khoản người bán không thể đặt hàng. Vui lòng dùng tài khoản người mua.');
      return false;
    }
    try {
      const { data } = await api.post('/auth/switch-role', { role: 'BUYER' });
      setSession({ user: data.user, accessToken: data.access_token });
      return true;
    } catch {
      Alert.alert('Thong bao', 'Không thể chuyển sang chế độ Mua hàng. Vui lòng thử lại.');
      return false;
    }
  };

  const showOrderPreview = async () => {
    if (!user || !accessToken) {
      router.replace({ pathname: '/auth/login', params: { returnTo: '/checkout', ids: ids.join(',') } });
      return;
    }

    if (!(await ensureBuyerRole())) return;

    if (lineItems.length === 0) {
      Alert.alert('Thong bao', 'Khong co san pham duoc chon de thanh toan.');
      return;
    }

    if (!fullName.trim() || !phone.trim() || !shippingAddress.trim()) {
      Alert.alert('Thong bao', 'Vui long nhap day du thong tin van chuyen.');
      return;
    }

    setShowPreview(true);
  };

  const placeOrder = async () => {
    if (!user || !accessToken) {
      router.replace({ pathname: '/auth/login', params: { returnTo: '/checkout', ids: ids.join(',') } });
      return;
    }

    const composedAddress = `${fullName.trim()} - ${phone.trim()} | ${shippingAddress.trim()}`;

    setSubmitting(true);
    try {
      let orderIds: string[] = [];
      let payUrl: string | undefined;
      let checkoutSessionId: string | undefined;

      if (isQuoteMode) {
        // ── Đặt hàng từ báo giá đã thương lượng ──────────────────────────────
        // BE tự chốt báo giá (PENDING → ACCEPTED) và tạo đơn trong 1 lần gọi.
        // Không gắn Authorization thủ công — interceptor lấy token MỚI NHẤT từ store
        // (sau khi có thể đã switch-role sang BUYER), tránh dùng token cũ activeRole SELLER.
        const checkoutResponse = await api.post(
          '/orders/checkout-quote',
          {
            quoteId: params.quoteId,
            paymentMethod,
            shippingAddress: composedAddress,
            phoneNumber: phone.trim(),
            note: note.trim() || undefined,
          },
        );

        const orderId: string | undefined = checkoutResponse.data?.orderId;
        if (orderId) orderIds = [orderId];
        checkoutSessionId = checkoutResponse.data?.checkoutSessionId;
        // checkout-quote trả payUrl trực tiếp cho MoMo (không cần gọi /payments/momo/create).
        payUrl = checkoutResponse.data?.payUrl || checkoutResponse.data?.deeplink;
      } else {
        // ── Đặt hàng từ giỏ hàng ─────────────────────────────────────────────
        const sellerOrders = Object.entries(shopGroups).map(([shopId, items]) => ({
          seller_id: shopId,
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          voucher_code: voucherByShop[shopId]?.code || undefined,
        }));

        const checkoutResponse = await api.post(
          '/orders/checkout',
          {
            shipping_address: composedAddress,
            payment_method: paymentMethod,
            note: note.trim() || undefined,
            seller_orders: sellerOrders,
          },
        );

        orderIds = checkoutResponse.data?.order_ids ?? [];
        checkoutSessionId = checkoutResponse.data?.checkout_session_id;

        if (paymentMethod === 'MOMO' && checkoutSessionId) {
          const momoRes = await api.post(
            '/payments/momo/create',
            { checkout_session_id: checkoutSessionId },
          );
          payUrl = momoRes.data?.payUrl || momoRes.data?.deeplink;
          checkoutSessionId = momoRes.data?.checkoutSessionId ?? checkoutSessionId;
        }
      }

      if (paymentMethod === 'MOMO') {
        if (!checkoutSessionId) {
          throw new Error('Khong lay duoc ma phien thanh toan MoMo.');
        }
        if (!payUrl) {
          throw new Error('Da tao yeu cau MoMo, nhung khong lay duoc link thanh toan.');
        }
        await Linking.openURL(payUrl);
      }

      // Chỉ checkout giỏ hàng mới xoá sản phẩm khỏi giỏ.
      if (!isQuoteMode) {
        removeItems(lineItems.map((item) => item.productId));
      }
      setShowPreview(false);

      router.replace({
        pathname: '/order-success',
        params: {
          orderIds: orderIds.join(','),
          totalAmount: finalTotal.toString(),
          itemCount: lineItems.length.toString(),
          paymentMethod,
          paymentId: checkoutSessionId,
        },
      });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Dat hang that bai.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            title="Ban can dang nhap de thanh toan"
            description="Vui long dang nhap de tiep tuc dat hang."
          />
          <TouchableOpacity
            className="mt-3 bg-[#16A34A] rounded-xl px-5 py-3"
            onPress={() =>
              router.replace({
                pathname: '/auth/login',
                params: { returnTo: '/checkout', ids: ids.join(',') },
              })
            }
          >
            <Text className="text-white font-bold">Dang nhap ngay</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop' }}
            className="h-52"
          >
            <View className="flex-1 bg-black/40 justify-end px-4 pb-5">
              <Text className="text-white text-4xl font-extrabold">Thanh toan don hang</Text>
            </View>
          </ImageBackground>

          <View className="px-4 py-4 bg-[#F8FAFC]">
            <View className="flex-row items-center">
              <Text className="text-slate-500">Trang chu</Text>
              <Text className="mx-2 text-slate-400">›</Text>
              <Text className="text-slate-500">{isQuoteMode ? 'Thuong luong' : 'Gio hang'}</Text>
              <Text className="mx-2 text-slate-400">›</Text>
              <Text className="text-slate-900 font-semibold">Thanh toan</Text>
            </View>

            {isQuoteMode ? (
              <View className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-orange-500 items-center justify-center mr-3">
                  <FontAwesome name="handshake-o" size={14} color="#fff" />
                </View>
                <Text className="flex-1 text-orange-700 text-sm font-semibold">
                  Don hang tu bao gia da thuong luong — gia da duoc chot voi nguoi ban.
                </Text>
              </View>
            ) : null}

            <View className="bg-white rounded-2xl border border-slate-100 mt-4 overflow-hidden">
              <View className="px-4 py-3 border-b border-slate-100 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-green-600 items-center justify-center mr-2">
                  <FontAwesome name="map-marker" size={14} color="#fff" />
                </View>
                <Text className="font-bold text-slate-900">Thong tin van chuyen</Text>
              </View>

              <View className="p-4 gap-3">
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ho ten nguoi nhan"
                  className="rounded-xl border border-slate-300 px-3 py-3 bg-slate-50"
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="So dien thoai"
                  keyboardType="phone-pad"
                  className="rounded-xl border border-slate-300 px-3 py-3 bg-slate-50"
                />
                <TextInput
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                  placeholder="So nha, duong, phuong/xa, quan/huyen, tinh/thanh pho"
                  multiline
                  textAlignVertical="top"
                  className="rounded-xl border border-slate-300 px-3 py-3 bg-slate-50 min-h-[90px]"
                />
              </View>
            </View>

            <View className="bg-white rounded-2xl border border-slate-100 mt-4 overflow-hidden">
              <View className="px-4 py-3 border-b border-slate-100 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center mr-2">
                  <FontAwesome name="credit-card" size={14} color="#fff" />
                </View>
                <Text className="font-bold text-slate-900">Phuong thuc thanh toan</Text>
              </View>

              <View className="p-4 gap-2">
                {[
                  { id: 'COD', title: 'Thanh toan khi nhan hang', sub: 'Tien mat (COD)', icon: 'truck' as const },
                  { id: 'MOMO', title: 'Vi dien tu MoMo', sub: 'Thanh toan qua app MoMo', icon: 'mobile' as const },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`rounded-xl border p-3 flex-row items-center ${
                      paymentMethod === method.id ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${paymentMethod === method.id ? 'bg-green-600' : 'bg-slate-200'}`}>
                      <FontAwesome name={method.icon} size={13} color={paymentMethod === method.id ? '#fff' : '#64748B'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-900">{method.title}</Text>
                      <Text className="text-xs text-slate-400">{method.sub}</Text>
                    </View>
                    <FontAwesome
                      name={paymentMethod === method.id ? 'dot-circle-o' : 'circle-o'}
                      size={18}
                      color={paymentMethod === method.id ? '#16A34A' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {Object.entries(shopGroups).map(([shopId, items]) => {
              const shopName = items[0]?.shopName?.trim() || 'Gian hang chua cap nhat';
              const shopSubtotal = subtotalByShop[shopId] ?? 0;
              const voucherState = voucherByShop[shopId] ?? getDefaultVoucherState();
              const availableShopVouchers = savedVouchers.filter(
                (sv) => sv.voucher?.seller_id === shopId,
              );

              return (
                <View key={shopId} className="bg-white rounded-2xl border border-slate-100 mt-4 overflow-hidden">
                  <View className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between">
                    <Text className="font-bold text-slate-900">{shopName}</Text>
                    <Text className="text-xs text-slate-400">{items.length} san pham</Text>
                  </View>

                  <View className="p-4 gap-3">
                    {items.map((item) => (
                      <View key={item.productId} className="flex-row items-center">
                        <Image
                          source={{ uri: resolveImageUrl(item.image) }}
                          className="w-12 h-12 rounded-lg"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{item.name}</Text>
                          <Text className="text-xs text-slate-400">{item.unit} x {item.quantity}</Text>
                        </View>
                        <Text className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</Text>
                      </View>
                    ))}
                  </View>

                  {isQuoteMode ? (
                    <View className="px-4 pb-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-slate-400">Tong shop</Text>
                        <Text className="font-black text-slate-900">{formatPrice(shopSubtotal)}</Text>
                      </View>
                    </View>
                  ) : (
                    <View className="px-4 pb-4">
                      <View className="flex-row gap-2">
                        <TextInput
                          value={voucherState.inputCode}
                          onChangeText={(text) =>
                            updateVoucherState(shopId, (prev) => ({ ...prev, inputCode: text, error: '' }))
                          }
                          placeholder="Nhap ma giam gia"
                          autoCapitalize="characters"
                          className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50"
                        />
                        <TouchableOpacity
                          className="bg-orange-300 rounded-xl px-4 items-center justify-center"
                          onPress={() => applyVoucher(shopId)}
                          disabled={voucherState.loading}
                        >
                          <Text className="text-white font-bold">{voucherState.loading ? '...' : 'Ap dung'}</Text>
                        </TouchableOpacity>
                      </View>

                      {availableShopVouchers.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                          <View className="flex-row gap-2">
                            {availableShopVouchers.map((sv) => {
                              const code = sv.voucher?.code ?? '';
                              const isApplied = voucherState.code === code;
                              return (
                                <TouchableOpacity
                                  key={`${shopId}-${code}`}
                                  className={`px-3 py-2 rounded-lg border ${
                                    isApplied
                                      ? 'border-green-400 bg-green-50'
                                      : 'border-orange-200 bg-orange-50'
                                  }`}
                                  onPress={() => void applySavedVoucher(shopId, code)}
                                  disabled={voucherState.loading}
                                >
                                  <Text className={`text-xs font-bold ${isApplied ? 'text-green-600' : 'text-orange-600'}`}>
                                    {code}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      ) : null}

                      {voucherState.code ? (
                        <View className="mt-2 flex-row items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <Text className="text-green-700 text-sm font-semibold">Da ap dung: {voucherState.code}</Text>
                          <TouchableOpacity onPress={() => removeVoucher(shopId)}>
                            <Text className="text-red-500 font-semibold">Xoa</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {voucherState.error ? <Text className="text-red-500 text-xs mt-2">{voucherState.error}</Text> : null}

                      <View className="mt-3 flex-row items-center justify-between">
                        <Text className="text-xs text-slate-400">Tong shop</Text>
                        <Text className="font-black text-slate-900">
                          {formatPrice(Math.max(0, shopSubtotal - (voucherState.discountAmount ?? 0)))}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <View className="bg-white rounded-2xl border border-slate-100 mt-4 p-4">
              <Text className="font-bold text-slate-900 mb-3">Tom tat thanh toan</Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500">Tam tinh</Text>
                <Text className="text-slate-800">{formatPrice(totalPrice)}</Text>
              </View>

              {!isQuoteMode ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-500">Giam gia voucher</Text>
                  <Text className="text-orange-500">-{formatPrice(totalDiscount)}</Text>
                </View>
              ) : null}

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-500">Phi van chuyen</Text>
                <Text className="text-green-600 font-semibold">Mien phi</Text>
              </View>

              <View className="h-px bg-slate-200 my-3" />

              <View className="flex-row justify-between mb-4">
                <Text className="text-slate-900 font-bold">Tong cong</Text>
                <Text className="text-[#16A34A] font-black text-2xl">{formatPrice(finalTotal)}</Text>
              </View>

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Ghi chu don hang (tuy chon)"
                className="rounded-xl border border-slate-300 px-3 py-2.5 bg-slate-50 mb-3"
              />

              {/* KHÔNG khoá nút theo role ở đây — showOrderPreview/ensureBuyerRole sẽ tự
                  switch sang BUYER (nếu sở hữu) hoặc báo lỗi thân thiện cho seller-only. */}
              <TouchableOpacity
                className={`py-3.5 rounded-xl items-center ${lineItems.length > 0 && !submitting ? 'bg-green-600' : 'bg-slate-300'}`}
                onPress={showOrderPreview}
                disabled={lineItems.length === 0 || submitting}
              >
                <Text className="text-white font-bold">{submitting ? 'Dang dat hang...' : 'TIEP TUC'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>

      <OrderPreviewModal
        visible={showPreview}
        groups={previewGroups}
        shippingAddress={`${fullName} - ${phone} | ${shippingAddress}`}
        note={note}
        totalPrice={totalPrice}
        totalDiscount={totalDiscount}
        finalTotal={finalTotal}
        paymentMethod={paymentMethod}
        loading={submitting}
        onConfirm={placeOrder}
        onCancel={() => setShowPreview(false)}
      />
    </>
  );
}
