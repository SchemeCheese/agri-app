import { FontAwesome } from '@expo/vector-icons';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatPrice } from '@/utils/format';

export type OrderPreviewItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  shop_name?: string;
  image?: string;
};

export type OrderPreviewGroup = {
  seller_id: string;
  seller_name?: string;
  items: OrderPreviewItem[];
  subtotal: number;
  discount: number;
  total: number;
};

interface OrderPreviewModalProps {
  visible: boolean;
  groups: OrderPreviewGroup[];
  shippingAddress: string;
  note?: string;
  totalPrice: number;
  totalDiscount: number;
  finalTotal: number;
  paymentMethod: 'COD' | 'MOMO';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const OrderPreviewRow = ({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string | number;
  bold?: boolean;
}) => (
  <View className="flex-row justify-between py-2">
    <Text className={`text-slate-600 ${bold ? 'font-semibold' : ''}`}>{label}</Text>
    <Text className={`text-slate-900 ${bold ? 'font-bold' : 'font-medium'}`}>{value}</Text>
  </View>
);

export function OrderPreviewModal({
  visible,
  groups,
  shippingAddress,
  note,
  totalPrice,
  totalDiscount,
  finalTotal,
  paymentMethod,
  loading = false,
  onConfirm,
  onCancel,
}: OrderPreviewModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <ScrollView className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Xem lại đơn hàng</Text>
          <TouchableOpacity onPress={onCancel} disabled={loading}>
            <FontAwesome name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Order Items by Shop */}
        <View className="px-4 py-4">
          {groups.map((group, idx) => (
            <View key={`${group.seller_id}-${idx}`} className="bg-white rounded-lg p-4 mb-4 border border-slate-100">
              {/* Shop Name */}
              <Text className="font-bold text-slate-900 mb-3 pb-3 border-b border-slate-100">
                {group.seller_name || `Shop ${idx + 1}`}
              </Text>

              {/* Items */}
              <View className="mb-3">
                {group.items.map((item, itemIdx) => (
                  <View key={`${item.product_id}-${itemIdx}`} className="flex-row justify-between py-2">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-900" numberOfLines={2}>
                        {item.product_name}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-1">x{item.quantity}</Text>
                    </View>
                    <Text className="font-semibold text-slate-900 ml-2">
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Shop Summary */}
              <View className="border-t border-slate-100 pt-3 mt-2">
                <OrderPreviewRow label="Tạm tính" value={formatPrice(group.subtotal)} />
                {group.discount > 0 && (
                  <OrderPreviewRow label="Giảm giá" value={`-${formatPrice(group.discount)}`} />
                )}
                <OrderPreviewRow label="Thành tiền" value={formatPrice(group.total)} bold />
              </View>
            </View>
          ))}
        </View>

        {/* Shipping Info */}
        <View className="px-4 mb-4">
          <View className="bg-white rounded-lg p-4 border border-slate-100">
            <Text className="font-bold text-slate-900 mb-3">Thông tin giao hàng</Text>
            <View className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
              <Text className="text-sm text-slate-700 leading-5">{shippingAddress}</Text>
            </View>
            {note && (
              <>
                <Text className="text-xs font-semibold text-slate-600 mb-2">Ghi chú</Text>
                <Text className="text-sm text-slate-700 mb-1">{note}</Text>
              </>
            )}
          </View>
        </View>

        {/* Payment Method */}
        <View className="px-4 mb-4">
          <View className="bg-white rounded-lg p-4 border border-slate-100">
            <Text className="font-bold text-slate-900 mb-2">Phương thức thanh toán</Text>
            <View className="flex-row items-center mt-2">
              <FontAwesome
                name={paymentMethod === 'COD' ? 'money' : 'mobile'}
                size={18}
                color="#15803D"
              />
              <Text className="ml-2 font-medium text-slate-900">
                {paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua MoMo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Total */}
        <View className="px-4 mb-4">
          <View className="bg-white rounded-lg p-4 border border-slate-100">
            <OrderPreviewRow label="Tổng tiền hàng" value={formatPrice(totalPrice)} />
            {totalDiscount > 0 && (
              <OrderPreviewRow label="Tổng giảm giá" value={`-${formatPrice(totalDiscount)}`} />
            )}
            <View className="border-t border-slate-100 py-2 mt-2" />
            <OrderPreviewRow label="TỔNG CỘNG" value={formatPrice(finalTotal)} bold />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 pb-6 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-slate-200 rounded-xl py-3 items-center justify-center"
            onPress={onCancel}
            disabled={loading}
          >
            <Text className="font-bold text-slate-700">Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 rounded-xl py-3 items-center justify-center ${
              loading ? 'bg-slate-300' : 'bg-[#16A34A]'
            }`}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Text className="font-bold text-white">Đang xử lý...</Text>
            ) : (
              <Text className="font-bold text-white">Xác nhận đặt hàng</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}
