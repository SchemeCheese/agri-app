import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { formatPrice } from '@/utils/format';

type PaymentState = 'PENDING' | 'PAID' | 'FAILED';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderIds?: string;
    totalAmount?: string;
    itemCount?: string;
    paymentMethod?: string;
    paymentId?: string;
  }>();

  const orderIds = params.orderIds ? params.orderIds.split(',').filter(Boolean) : [];
  const totalAmount = params.totalAmount ? Number(params.totalAmount) : 0;
  const itemCount = params.itemCount ? Number(params.itemCount) : 0;
  const isMomo = params.paymentMethod === 'MOMO';
  const paymentId = params.paymentId;
  const mainOrderCode = orderIds[0]
    ? `#ORD-${orderIds[0].slice(-4).toUpperCase()}`
    : '#ORD-0000';

  const [paymentState, setPaymentState] = useState<PaymentState>(
    isMomo ? 'PENDING' : 'PAID',
  );
  const [statusMessage, setStatusMessage] = useState('');

  const checkPayment = useCallback(async () => {
    if (!isMomo || !paymentId) return;

    try {
      const response = await api.get(`/payments/momo/status/${paymentId}`);
      const status = response.data?.paymentStatus;
      if (status === 'PAID') {
        setPaymentState('PAID');
        setStatusMessage('');
      } else if (status === 'FAILED') {
        setPaymentState('FAILED');
        setStatusMessage('Giao dịch chưa thành công. Bạn có thể thử thanh toán lại trong đơn hàng.');
      }
    } catch {
      setStatusMessage('Chưa kết nối được máy chủ để kiểm tra thanh toán. Hệ thống sẽ tự thử lại.');
    }
  }, [isMomo, paymentId]);

  useEffect(() => {
    if (!isMomo || !paymentId || paymentState !== 'PENDING') return;

    void checkPayment();
    const interval = setInterval(() => void checkPayment(), 4000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkPayment();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkPayment, isMomo, paymentId, paymentState]);

  const title =
    paymentState === 'PAID'
      ? isMomo
        ? 'Thanh toán MoMo thành công!'
        : 'Đặt hàng thành công!'
      : paymentState === 'FAILED'
        ? 'Thanh toán chưa thành công'
        : 'Đang xác nhận thanh toán MoMo';

  const subtitle =
    paymentState === 'PAID'
      ? 'Đơn hàng đã được hệ thống ghi nhận.'
      : paymentState === 'FAILED'
        ? 'Đơn hàng vẫn được giữ để bạn có thể thanh toán lại hoặc đổi sang COD.'
        : 'Vui lòng quay lại đây sau khi hoàn tất trong MoMo. Hệ thống đang đối soát giao dịch.';

  const accent = paymentState === 'FAILED' ? '#DC2626' : paymentState === 'PAID' ? '#15803D' : '#A50064';

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-10 pb-6 px-5">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${accent}18` }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: accent }}
            >
              {paymentState === 'PENDING' ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <FontAwesome
                  name={paymentState === 'PAID' ? 'check' : 'times'}
                  size={40}
                  color="#fff"
                />
              )}
            </View>
          </View>
          <Text className="text-2xl font-bold text-slate-900 text-center">{title}</Text>
          <Text className="text-sm text-slate-500 mt-2 text-center">{subtitle}</Text>
          {statusMessage ? (
            <Text className="text-xs text-amber-700 mt-3 text-center">{statusMessage}</Text>
          ) : null}
        </View>

        <View className="mx-4 mb-6 rounded-2xl p-6 bg-emerald-800">
          <View className="items-center mb-5">
            <Text className="text-white/70 text-xs font-medium mb-2">MÃ ĐƠN HÀNG</Text>
            <Text className="text-white text-3xl font-bold">{mainOrderCode}</Text>
          </View>
          <View className="border-t border-white/20 pt-4 flex-row justify-between">
            <View>
              <Text className="text-white/70 text-xs">SỐ LƯỢNG</Text>
              <Text className="text-white text-lg font-bold">{itemCount}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/70 text-xs">TỔNG TIỀN</Text>
              <Text className="text-white text-lg font-bold">{formatPrice(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {isMomo && paymentState === 'PENDING' ? (
          <View className="mx-4 mb-6 rounded-xl border border-pink-200 bg-pink-50 p-4">
            <Text className="font-bold text-pink-800">Không đóng đơn hoặc thanh toán lại ngay</Text>
            <Text className="text-sm text-pink-700 mt-1">
              Việc xác nhận có thể mất vài giây. App sẽ kiểm tra lại khi bạn quay về từ MoMo.
            </Text>
            <TouchableOpacity
              className="mt-3 rounded-lg bg-pink-700 py-2.5 items-center"
              onPress={() => void checkPayment()}
            >
              <Text className="text-white font-bold">Kiểm tra lại ngay</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="mx-4 mb-8 gap-3">
          <TouchableOpacity
            className="bg-[#15803D] rounded-xl py-4 items-center"
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <Text className="text-white font-bold">Xem đơn hàng của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-100 rounded-xl py-4 items-center"
            onPress={() => router.replace('/')}
          >
            <Text className="text-slate-700 font-bold">Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
