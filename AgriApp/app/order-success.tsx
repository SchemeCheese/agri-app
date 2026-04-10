import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { formatPrice } from '@/utils/format';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderIds?: string;
    totalAmount?: string;
    itemCount?: string;
  }>();

  const orderIds = params.orderIds ? params.orderIds.split(',') : [];
  const totalAmount = params.totalAmount ? parseFloat(params.totalAmount) : 0;
  const itemCount = params.itemCount ? parseInt(params.itemCount) : 0;

  // Get the first (or main) order code for display
  const mainOrderCode = orderIds[0] ? `#ORD-${orderIds[0].slice(-4).toUpperCase()}` : '#ORD-0000';

  const handleContinueShopping = () => {
    router.replace('/(tabs)/home');
  };

  const handleViewOrders = () => {
    router.replace('/(tabs)/profile');
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Success Badge */}
        <View className="items-center pt-10 pb-6">
          <View className="w-24 h-24 rounded-full bg-[#15803D]/10 items-center justify-center mb-4">
            <View className="w-20 h-20 rounded-full bg-[#15803D] items-center justify-center">
              <FontAwesome name="check" size={40} color="white" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-slate-900">Đặt hàng thành công!</Text>
          <Text className="text-sm text-slate-500 mt-2 px-4 text-center">
            Cảm ơn bạn đã mua sắm tại AgriStore
          </Text>
        </View>

        {/* Order Info Card */}
        <View className="mx-4 mb-6">
          <View className="bg-gradient-to-br from-[#15803D] to-[#166534] rounded-2xl p-6 overflow-hidden">
            {/* Order Code */}
            <View className="items-center mb-6">
              <Text className="text-white/70 text-xs font-medium mb-2">MÃ ĐƠN HÀNG</Text>
              <Text className="text-white text-3xl font-bold font-mono">{mainOrderCode}</Text>
            </View>

            {/* Order Details */}
            <View className="border-t border-white/20 pt-4 space-y-4">
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-white/70 text-xs font-medium mb-1">SỐ LƯỢNG SẢN PHẨM</Text>
                  <Text className="text-white text-lg font-bold">{itemCount}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/70 text-xs font-medium mb-1">TỔNG TIỀN</Text>
                  <Text className="text-white text-lg font-bold">{formatPrice(totalAmount)}</Text>
                </View>
              </View>
            </View>

            {/* Order IDs (if multiple) */}
            {orderIds.length > 1 && (
              <View className="border-t border-white/20 mt-4 pt-4">
                <Text className="text-white/70 text-xs font-medium mb-2">CÁC ĐƠN HÀNG LIÊN QUAN</Text>
                <View className="flex-row flex-wrap gap-2">
                  {orderIds.map((orderId, idx) => (
                    <View key={orderId} className="bg-white/20 rounded-lg px-3 py-2">
                      <Text className="text-white text-xs font-mono">#{orderId.slice(-4).toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Next Steps */}
        <View className="mx-4 mb-6">
          <Text className="text-base font-bold text-slate-900 mb-4">Những bước tiếp theo</Text>

          <View className="space-y-3">
            {/* Step 1 */}
            <View className="flex-row items-start bg-white rounded-xl p-4 border border-slate-100">
              <View className="w-8 h-8 rounded-full bg-[#15803D]/10 items-center justify-center mr-3 mt-0.5">
                <Text className="text-[#15803D] font-bold text-sm">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 mb-1">Chờ xác nhận từ cửa hàng</Text>
                <Text className="text-xs text-slate-500">Cửa hàng sẽ xác nhận đơn hàng trong vòng 24 giờ</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View className="flex-row items-start bg-white rounded-xl p-4 border border-slate-100">
              <View className="w-8 h-8 rounded-full bg-[#15803D]/10 items-center justify-center mr-3 mt-0.5">
                <Text className="text-[#15803D] font-bold text-sm">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 mb-1">Chuẩn bị và giao hàng</Text>
                <Text className="text-xs text-slate-500">Sản phẩm sẽ được giao đến bạn trong 3-5 ngày</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View className="flex-row items-start bg-white rounded-xl p-4 border border-slate-100">
              <View className="w-8 h-8 rounded-full bg-[#15803D]/10 items-center justify-center mr-3 mt-0.5">
                <Text className="text-[#15803D] font-bold text-sm">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 mb-1">Nhận hàng và xác nhận</Text>
                <Text className="text-xs text-slate-500">Kiểm tra hàng và xác nhận nhận được</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Info */}
        <View className="mx-4 mb-6 bg-blue-50 rounded-xl p-4 border border-blue-200 flex-row items-start">
          <FontAwesome name="info-circle" size={18} color="#0EA5E9" style={{ marginTop: 2, marginRight: 12 }} />
          <Text className="flex-1 text-sm text-blue-900 leading-5">
            Chúng tôi sẽ gửi email và thông báo để cập nhật trạng thái đơn hàng của bạn
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mb-8 gap-3">
          <TouchableOpacity
            className="bg-[#15803D] rounded-xl py-4 items-center justify-center active:opacity-80"
            onPress={handleViewOrders}
          >
            <FontAwesome name="shopping-bag" size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold">Xem đơn hàng của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-100 rounded-xl py-4 items-center justify-center active:opacity-80"
            onPress={handleContinueShopping}
          >
            <FontAwesome name="arrow-left" size={16} color="#374151" style={{ marginRight: 8 }} />
            <Text className="text-slate-700 font-bold">Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
